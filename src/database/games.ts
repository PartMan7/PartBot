import { Temporal } from '@js-temporal/polyfill';
import mongoose, { type HydratedDocument } from 'mongoose';
import { pokedex } from 'ps-client/data';

import { IS_ENABLED } from '@/enabled';
import { ScrabbleMods } from '@/ps/games/scrabble/constants';
import { GamesList } from '@/ps/games/types';
import { TimeZone } from '@/ps/handlers/cron/constants';
import { generateOklchColors } from '@/utils/color';
import { toId } from '@/utils/toId';

import type { Log as ScrabbleLog } from '@/ps/games/scrabble/logs';
import type { WinCtx as ScrabbleWinCtx } from '@/ps/games/scrabble/types';
import type { BaseLog, Player } from '@/ps/games/types';

const schema = new mongoose.Schema<GameModel>({
	id: {
		type: String,
		required: true,
		unique: true,
	},
	game: {
		type: String,
		required: true,
	},
	mod: String,
	room: {
		type: String,
		required: true,
	},
	seed: Number,
	players: {
		type: Map,
		of: {
			name: {
				type: String,
				required: true,
			},
			id: {
				type: String,
				required: true,
			},
			turn: {
				type: String,
				required: true,
			},
			out: Boolean,
		},
		required: true,
	},
	created: {
		type: Date,
		required: true,
	},
	started: {
		type: Date,
		required: true,
	},
	ended: {
		type: Date,
		required: true,
		default: Date.now,
	},
	log: [String],
	winCtx: mongoose.Schema.Types.Mixed,
});

export interface GameModel {
	id: string;
	game: string;
	mod?: string | null | undefined;
	room: string;
	seed?: number | null;
	players: Map<string, Player>;
	created: Date;
	started: Date | null;
	ended: Date;
	log: string[];
	winCtx?: { type: 'win'; winner: Player } | unknown;
}
const model = mongoose.model('game', schema, 'games', { overwriteModels: true });

export type NormalizedGame = Omit<GameModel, 'players' | 'log'> & { players: Record<string, Player>; log: BaseLog[] };

export async function uploadGame(game: GameModel): Promise<GameModel | null> {
	if (!IS_ENABLED.DB) return null;
	return model.create(game);
}

// Hydrate logStrings into log objects
export function normalizeGame(game: HydratedDocument<GameModel>): NormalizedGame {
	const serializable = 'toJSON' in game ? game.toJSON()! : game;
	return { ...serializable, log: serializable.log.map(entry => JSON.parse(entry)) };
}

export async function getGameById(gameType: string, gameId: string): Promise<HydratedDocument<GameModel> | null> {
	if (!IS_ENABLED.DB) return null;
	const id = gameId.toUpperCase().replace(/^#?/, '#');
	const game = await model.findOne({ game: gameType, id });
	if (!game) throw new Error(`Unable to find a game of ${gameType} with ID ${id}.`);
	return game;
}

// UGO-CODE
export type ScrabbleDexEntry = {
	pokemon: string;
	pokemonName: string;
	num: number;
	by: string;
	byName: string | null;
	at: Date;
	gameId: string;
	mod: string;
	won: boolean;
};
export type GamesChartDay = {
	date: string;
	games: Record<string, number>;
	total: number;
};

export type GamesChartResponse = {
	days: GamesChartDay[];
	colors: Record<string, string>;
};

const CHART_OKLCH_L = 0.65;
const CHART_OKLCH_C = 0.15;

let gamesChartCache: { date: string; byRoom: Map<string, GamesChartResponse> } | null = null;

export async function getGamesChartData(room: string): Promise<GamesChartResponse> {
	if (!IS_ENABLED.DB) return { days: [], colors: {} };

	const today = Temporal.Now.plainDateISO(TimeZone.GMT).toString();
	if (gamesChartCache?.date === today) {
		const cached = gamesChartCache.byRoom.get(room);
		if (cached) return cached;
	}

	const since = Temporal.Now.plainDateISO(TimeZone.GMT)
		.subtract({ days: 364 })
		.toZonedDateTime({ timeZone: TimeZone.GMT })
		.toInstant();

	const games = await model
		.find({ room, ended: { $gte: new Date(since.epochMilliseconds) } })
		.select('game ended')
		.lean();
	const byDate = new Map<string, GamesChartDay>();
	const gameTypes = new Set<string>();

	for (const game of games) {
		gameTypes.add(game.game);
		const date = Temporal.Instant.fromEpochMilliseconds(game.ended.getTime())
			.toZonedDateTimeISO(TimeZone.GMT)
			.toPlainDate()
			.toString();
		let day = byDate.get(date);
		if (!day) {
			day = { date, games: {}, total: 0 };
			byDate.set(date, day);
		}

		day.games[game.game] = (day.games[game.game] ?? 0) + 1;
		day.total++;
	}

	const result: GamesChartResponse = {
		days: [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)),
		colors: generateOklchColors([...gameTypes].sort(), CHART_OKLCH_L, CHART_OKLCH_C),
	};

	if (!gamesChartCache || gamesChartCache.date !== today) {
		gamesChartCache = { date: today, byRoom: new Map() };
	}
	gamesChartCache.byRoom.set(room, result);
	return result;
}

export async function getScrabbleDex(): Promise<ScrabbleDexEntry[] | null> {
	if (!IS_ENABLED.DB) return null;
	const scrabbleGames = await model.find({ game: GamesList.Scrabble, mod: [ScrabbleMods.CRAZYMONS, ScrabbleMods.POKEMON] }).lean();
	return scrabbleGames.flatMap(game => {
		const baseCtx = { gameId: game.id, mod: game.mod! };
		const winCtx = game.winCtx as ScrabbleWinCtx | undefined;
		const winners = winCtx?.type === 'win' ? winCtx.winnerIds : [];
		const logs = game.log.map<ScrabbleLog>(log => JSON.parse(log));
		if (winCtx?.type === 'dq' || winCtx?.type === 'regular') {
			const leftUsers = logs.filter(log => log.action === 'dq' || log.action === 'forfeit').map(log => log.turn);
			if (winCtx.type === 'dq')
				winners.push(
					...Object.values(game.players)
						.map(player => player.turn)
						.filter(player => !leftUsers.includes(player))
				);
			else if (winCtx.type === 'regular' && logs.filter(log => log.action === 'play').length > 20) {
				const points: Record<string, number> = {};
				logs.forEach(log => {
					if (log.action === 'play') {
						points[log.turn] ??= 0;
						points[log.turn] += log.ctx.points.total;
					}
				});
				const players = Object.entries(points).filter(([player]) => !leftUsers.includes(player));
				const maxPoints = Math.max(...players.map(([_player, score]) => score));
				winners.push(...players.filter(([_player, score]) => score === maxPoints).map(([player]) => player));
			}
		}
		return logs
			.filterMap<ScrabbleDexEntry[]>(log => {
				if (log.action !== 'play') return;
				const words = Object.keys(log.ctx.words).map(toId).unique();
				return words.filterMap<ScrabbleDexEntry>(word => {
					if (!(word in pokedex)) return;
					let mon = pokedex[word];
					if (mon.baseSpecies) mon = pokedex[toId(mon.baseSpecies)];
					if (mon.num <= 0) return;
					return {
						...baseCtx,
						pokemon: word,
						pokemonName: mon.name,
						num: mon.num,
						by: log.turn,
						byName: game.players[log.turn]?.name ?? null,
						at: log.time,
						won: winners.includes(log.turn),
					};
				});
			})
			.flat();
	});
}
