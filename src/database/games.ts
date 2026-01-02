import mongoose, { type HydratedDocument } from 'mongoose';
import { pokedex } from 'ps-client/data';

import { IS_ENABLED } from '@/enabled';
import { ScrabbleMods } from '@/ps/games/scrabble/constants';
import { GamesList } from '@/ps/games/types';
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
					let mon = pokedex[word]!;
					if (mon.baseSpecies) mon = pokedex[toId(mon.baseSpecies)] ?? mon;
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
