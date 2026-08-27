import {
	ACTIONS,
	AzulMods,
	BONUS_COL,
	BONUS_COLOR,
	BONUS_ROW,
	FACTORY_COUNT,
	FLOOR_PENALTIES,
	FLOOR_SIZE,
	PATTERN_LENGTHS,
	POST_TURN_ACTIONS,
	TILES,
	TILES_PER_COLOR,
	TILES_PER_FACTORY,
	TILE_LABELS,
	Tile,
	VIEW_ACTION_TYPE,
	WALL_PATTERN,
} from '@/ps/games/azul/constants';
import { AzulModData } from '@/ps/games/azul/mods';
import { render, renderLog } from '@/ps/games/azul/render';
import { BaseGame } from '@/ps/games/game';
import { createGrid } from '@/ps/games/utils';
import { ChatError } from '@/utils/chatError';
import { toId } from '@/utils/toId';

import type { TranslatedText } from '@/i18n/types';
import type { Log } from '@/ps/games/azul/logs';
import type { FloorTile, PendingWall, PlayerBoard, RenderCtx, State, Turn, ViewType, WinCtx } from '@/ps/games/azul/types';
import type { BaseContext } from '@/ps/games/game';
import type { ActionResponse, BaseState, EndType, Player } from '@/ps/games/types';
import type { User } from 'ps-client';

export { meta } from '@/ps/games/azul/meta';

const TILE_I18N = {
	[Tile.Water]: 'GAME.AZUL.TILE.WATER',
	[Tile.Electric]: 'GAME.AZUL.TILE.ELECTRIC',
	[Tile.Fire]: 'GAME.AZUL.TILE.FIRE',
	[Tile.Grass]: 'GAME.AZUL.TILE.GRASS',
	[Tile.Dark]: 'GAME.AZUL.TILE.DARK',
} as const;

export class Azul extends BaseGame<State> {
	log: Log[] = [];
	declare winCtx?: WinCtx | { type: EndType };
	mod: AzulMods | null = null;

	constructor(ctx: BaseContext) {
		super(ctx);
		if (ctx.args.length) {
			const applied = this.tryApplyMod(ctx.args.join(' '));
			if (!applied.success) throw new ChatError(applied.error);
			this.room.send(applied.data);
		}
		super.persist(ctx);

		if (ctx.backup) return;

		this.state.board = { factories: [], center: { first: true } };
		this.state.bag = [];
		this.state.lid = [];
		this.state.playerData = {};
		this.state.actionState = { action: VIEW_ACTION_TYPE.NONE };
		this.state.wallQueue = [];
		this.state.nextStarter = null;
		this.state.ending = false;
		this.state.round = 0;
	}

	chatLog(log: Log): void {
		this.log.push(log);
		this.room.sendHTML(renderLog(log, this), { name: `${this.id}-chatlog` });
	}

	moddable() {
		return !this.started;
	}

	applyMod(mod: AzulMods): ActionResponse<TranslatedText> {
		this.mod = mod;
		return { success: true, data: this.$T('GAME.APPLIED_MOD', { mod: AzulModData[mod].name, id: this.id }) };
	}

	createPlayerBoard(name: string, input: Partial<PlayerBoard> = {}): PlayerBoard {
		return {
			score: 0,
			pattern: PATTERN_LENGTHS.map(len => Array.from({ length: len }, () => null)),
			wall: createGrid<Tile | null>(5, 5, () => null),
			floor: [],
			...input,
			id: toId(name),
			name,
		};
	}

	onStart(): ActionResponse {
		const playerCount = Object.keys(this.players).length as 2 | 3 | 4;
		const factoryCount = FACTORY_COUNT[playerCount];

		this.state.bag = TILES.flatMap(tile => Array.from({ length: TILES_PER_COLOR }, () => tile)).shuffle(this.prng);
		this.state.lid = [];
		this.state.board = {
			factories: Array.from({ length: factoryCount }, () => []),
			center: { first: true },
		};
		this.state.playerData = Object.fromEntries(
			Object.values(this.players).map(player => [player.turn, this.createPlayerBoard(player.name)])
		);
		this.state.actionState = { action: VIEW_ACTION_TYPE.NONE };
		this.state.wallQueue = [];
		this.state.nextStarter = null;
		this.state.ending = false;
		this.state.round = 1;

		this.refillFactories();
		return { success: true, data: null };
	}

	onReplacePlayer(turn: BaseState['turn'], withPlayer: User): ActionResponse {
		const newData = this.createPlayerBoard(withPlayer.name, this.state.playerData[turn]);
		delete this.state.playerData[turn];
		this.state.playerData[withPlayer.id] = newData;
		if (this.state.nextStarter === turn) this.state.nextStarter = withPlayer.id;
		this.state.wallQueue.forEach(entry => {
			if (entry.turn === turn) entry.turn = withPlayer.id;
		});
		return { success: true, data: null };
	}

	onRemovePlayer(player: Player): ActionResponse<'end' | null> {
		if (this.started) {
			this.state.playerData[player.turn].out = true;
			if (Object.values(this.players).filter(p => !p.out).length <= 1) return { success: true, data: 'end' };
		}
		return { success: true, data: null };
	}

	drawFromBag(count: number): Tile[] {
		const drawn: Tile[] = [];
		for (let i = 0; i < count; i++) {
			if (this.state.bag.length === 0) {
				if (this.state.lid.length === 0) break;
				this.state.bag = this.state.lid.shuffle(this.prng);
				this.state.lid = [];
			}
			drawn.push(this.state.bag.pop()!);
		}
		return drawn;
	}

	refillFactories(): void {
		this.state.board.factories = this.state.board.factories.map(() => this.drawFromBag(TILES_PER_FACTORY));
		this.state.board.center = { first: true };
	}

	roundHasTiles(): boolean {
		return (
			this.state.board.factories.some(factory => factory.length > 0) || TILES.some(tile => (this.state.board.center[tile] ?? 0) > 0)
		);
	}

	action(user: User, ctx: string): void {
		if (!this.started) this.throw('GAME.NOT_STARTED');
		if (user.id !== this.players[this.turn!].id) this.throw('GAME.IMPOSTOR_ALERT');
		const player = this.getPlayer(user)!;
		const [action, actionCtx] = ctx.lazySplit(' ', 1);

		if (this.state.actionState.action === POST_TURN_ACTIONS.WALL && action !== POST_TURN_ACTIONS.WALL) {
			throw new ChatError(this.$T('GAME.AZUL.CHOOSE_WALL_COLUMN'));
		}
		if (this.state.actionState.action === VIEW_ACTION_TYPE.PLACE && action !== ACTIONS.PLACE && action !== ACTIONS.TAKE) {
			throw new ChatError(this.$T('GAME.AZUL.PLACE_TILES'));
		}

		switch (action) {
			case ACTIONS.TAKE: {
				this.takeTiles(player, actionCtx);
				this.update(user.id);
				return;
			}
			case ACTIONS.PLACE: {
				this.placeTiles(player, actionCtx);
				return;
			}
			case POST_TURN_ACTIONS.WALL: {
				this.placeWallColumn(player, actionCtx);
				return;
			}
			default:
				throw new ChatError(this.$T('GAME.AZUL.UNRECOGNIZED_ACTION', { action }));
		}
	}

	tileName(tile: Tile): TranslatedText {
		return this.$T(TILE_I18N[tile]);
	}

	takeTiles(_player: Player, actionCtx: string): void {
		const [source, colorRaw] = actionCtx.lazySplit(' ', 1);
		const color = this.parseTile(colorRaw);

		let count: number;
		let tookFirst = false;

		if (source === 'center') {
			const pile = this.state.board.center;
			count = pile[color] ?? 0;
			if (count <= 0) throw new ChatError(this.$T('GAME.AZUL.NO_TILES_IN_CENTER', { tile: this.tileName(color) }));
			tookFirst = !!pile.first;
		} else {
			const factoryIndex = +source;
			if (!Number.isInteger(factoryIndex) || factoryIndex < 0 || factoryIndex >= this.state.board.factories.length) {
				throw new ChatError(this.$T('GAME.AZUL.INVALID_FACTORY'));
			}
			const factory = this.state.board.factories[factoryIndex];
			count = factory.filter(tile => tile === color).length;
			if (count <= 0) throw new ChatError(this.$T('GAME.AZUL.NO_TILES_IN_FACTORY', { tile: this.tileName(color) }));
		}

		this.state.actionState = {
			action: VIEW_ACTION_TYPE.PLACE,
			source: source === 'center' ? 'center' : +source,
			color,
			count,
			tookFirst,
		};
	}

	commitTake(player: Player, source: 'center' | number, color: Tile, tookFirst: boolean): void {
		if (source === 'center') {
			const pile = this.state.board.center;
			if ((pile[color] ?? 0) <= 0) throw new ChatError(this.$T('GAME.AZUL.NO_TILES_IN_CENTER', { tile: this.tileName(color) }));
			delete pile[color];
			if (tookFirst && pile.first) {
				pile.first = false;
				this.state.nextStarter = player.turn;
			}
			return;
		}
		const factory = this.state.board.factories[source];
		if (!factory.includes(color)) {
			throw new ChatError(this.$T('GAME.AZUL.NO_TILES_IN_FACTORY', { tile: this.tileName(color) }));
		}
		const leftovers = factory.filter(tile => tile !== color);
		this.state.board.factories[source] = [];
		leftovers.forEach(tile => {
			this.state.board.center[tile] = (this.state.board.center[tile] ?? 0) + 1;
		});
	}

	placeTiles(player: Player, actionCtx: string): void {
		if (this.state.actionState.action !== VIEW_ACTION_TYPE.PLACE) {
			throw new ChatError(this.$T('GAME.AZUL.NO_TILES_TO_PLACE'));
		}
		const { source, color, count, tookFirst } = this.state.actionState;
		const playerData = this.state.playerData[player.turn];
		const target = actionCtx.trim();

		let row: number | 'floor';
		let overflow = 0;

		if (target === 'floor') {
			row = 'floor';
			overflow = count;
		} else {
			const rowIndex = +target;
			if (!Number.isInteger(rowIndex) || rowIndex < 0 || rowIndex >= 5) {
				throw new ChatError(this.$T('GAME.AZUL.CHOOSE_PATTERN_OR_FLOOR'));
			}
			if (!this.canPlaceOnRow(playerData, rowIndex, color)) {
				throw new ChatError(this.$T('GAME.AZUL.CANNOT_PLACE_ON_ROW'));
			}
			row = rowIndex;
			const capacity = playerData.pattern[rowIndex].filter(t => t === null).length;
			overflow = count - Math.min(count, capacity);
		}

		this.commitTake(player, source, color, tookFirst);

		if (row !== 'floor') {
			const line = playerData.pattern[row];
			let remaining = count - overflow;
			for (let i = line.length - 1; i >= 0 && remaining > 0; i--) {
				if (line[i] === null) {
					line[i] = color;
					remaining--;
				}
			}
		}

		if (tookFirst) this.addToFloor(playerData, 'first');
		for (let i = 0; i < overflow; i++) this.addToFloor(playerData, color);

		this.chatLog({
			turn: player.turn,
			time: new Date(),
			action: ACTIONS.PLACE,
			ctx: { color, count, row, overflow },
		});

		this.state.actionState = { action: VIEW_ACTION_TYPE.NONE };
		this.backup();

		if (!this.roundHasTiles()) {
			this.startWallTiling();
			return;
		}
		this.endTurn();
	}

	canPlaceOnRow(playerData: PlayerBoard, row: number, color: Tile): boolean {
		const line = playerData.pattern[row];
		if (line.every(t => t !== null)) return false;
		const existing = line.find(t => t !== null);
		if (existing && existing !== color) return false;
		if (playerData.wall[row].some(cell => cell === color)) return false;
		if (this.mod === AzulMods.FREE_GRID) {
			const hasLegalCol = [0, 1, 2, 3, 4].some(
				col => playerData.wall[row][col] === null && !playerData.wall.some(wallRow => wallRow[col] === color)
			);
			if (!hasLegalCol) return false;
		}
		return true;
	}

	addToFloor(playerData: PlayerBoard, tile: FloorTile): void {
		if (playerData.floor.length < FLOOR_SIZE) playerData.floor.push(tile);
		else if (tile !== 'first') this.state.lid.push(tile);
	}

	parseTile(raw: string): Tile {
		const id = toId(raw);
		const tile = TILES.find(t => toId(t) === id || toId(TILE_LABELS[t]) === id);
		if (!tile) throw new ChatError(this.$T('GAME.AZUL.INVALID_TILE', { tile: raw }));
		return tile;
	}

	startWallTiling(): void {
		const queue: PendingWall[] = [];
		this.turns.forEach(turn => {
			const playerData = this.state.playerData[turn];
			if (playerData.out) return;
			playerData.pattern.forEach((line, row) => {
				if (line.every(t => t !== null)) queue.push({ turn, row, color: line[0]! });
			});
		});
		this.state.wallQueue = queue;
		this.continueWallTiling();
	}

	continueWallTiling(): void {
		const batch: { turn: Turn; row: number; col: number; color: Tile; points: number }[] = [];

		while (this.state.wallQueue.length > 0) {
			const next = this.state.wallQueue[0];
			const playerData = this.state.playerData[next.turn];

			if (this.mod === AzulMods.FREE_GRID) {
				const legalCols = [0, 1, 2, 3, 4].filter(
					col => playerData.wall[next.row][col] === null && !playerData.wall.some(wallRow => wallRow[col] === next.color)
				);
				if (legalCols.length === 1) {
					batch.push(this.applyWallTile(next.turn, next.row, legalCols[0], next.color));
					this.state.wallQueue.shift();
					continue;
				}
				if (legalCols.length > 1) {
					this.flushWallLog(batch);
					this.turn = next.turn;
					this.state.actionState = { action: POST_TURN_ACTIONS.WALL, pending: next };
					this.update();
					this.backup();
					this.setTimer('Wall placement');
					return;
				}
				throw new Error(`No legal wall column for ${next.color} on row ${next.row}`);
			}

			batch.push(this.applyWallTile(next.turn, next.row, WALL_PATTERN[next.row].indexOf(next.color), next.color));
			this.state.wallQueue.shift();
		}

		this.flushWallLog(batch);
		this.finishRoundScoring();
	}

	flushWallLog(tiles: { turn: Turn; row: number; col: number; color: Tile; points: number }[]): void {
		if (!tiles.length) return;
		this.chatLog({
			turn: tiles[0].turn,
			time: new Date(),
			action: POST_TURN_ACTIONS.WALL,
			ctx: { tiles },
		});
	}

	placeWallColumn(player: Player, actionCtx: string): void {
		if (this.state.actionState.action !== POST_TURN_ACTIONS.WALL) {
			throw new ChatError(this.$T('GAME.AZUL.NO_WALL_PENDING'));
		}
		const pending = this.state.actionState.pending;
		if (pending.turn !== player.turn) throw new ChatError(this.$T('GAME.AZUL.NOT_YOUR_WALL'));

		const col = +actionCtx;
		const playerData = this.state.playerData[player.turn];
		if (
			!Number.isInteger(col) ||
			col < 0 ||
			col > 4 ||
			playerData.wall[pending.row][col] !== null ||
			playerData.wall.some(wallRow => wallRow[col] === pending.color)
		) {
			throw new ChatError(this.$T('GAME.AZUL.ILLEGAL_WALL_COLUMN'));
		}

		this.flushWallLog([this.applyWallTile(pending.turn, pending.row, col, pending.color)]);
		this.state.wallQueue.shift();
		this.state.actionState = { action: VIEW_ACTION_TYPE.NONE };
		this.backup();
		this.continueWallTiling();
	}

	applyWallTile(
		turn: Turn,
		row: number,
		col: number,
		color: Tile
	): { turn: Turn; row: number; col: number; color: Tile; points: number } {
		const playerData = this.state.playerData[turn];
		playerData.wall[row][col] = color;
		const points = this.scorePlacement(playerData.wall, row, col);
		playerData.score += points;

		const line = playerData.pattern[row];
		for (let i = 0; i < line.length - 1; i++) this.state.lid.push(color);
		playerData.pattern[row] = Array.from({ length: line.length }, () => null);

		if (playerData.wall[row].every(cell => cell !== null)) this.state.ending = true;

		return { turn, row, col, color, points };
	}

	scorePlacement(wall: (Tile | null)[][], row: number, col: number): number {
		let horizontal = 1;
		for (let c = col - 1; c >= 0 && wall[row][c] !== null; c--) horizontal++;
		for (let c = col + 1; c < 5 && wall[row][c] !== null; c++) horizontal++;

		let vertical = 1;
		for (let r = row - 1; r >= 0 && wall[r][col] !== null; r--) vertical++;
		for (let r = row + 1; r < 5 && wall[r][col] !== null; r++) vertical++;

		if (horizontal === 1 && vertical === 1) return 1;
		return (horizontal > 1 ? horizontal : 0) + (vertical > 1 ? vertical : 0);
	}

	finishRoundScoring(): void {
		this.turns.forEach(turn => {
			const playerData = this.state.playerData[turn];
			if (playerData.out) return;

			let penalty = 0;
			playerData.floor.forEach((tile, i) => {
				penalty += FLOOR_PENALTIES[i];
				if (tile !== 'first') this.state.lid.push(tile);
			});
			playerData.floor = [];
			playerData.score = Math.max(0, playerData.score + penalty);
		});

		if (this.state.ending) {
			Object.values(this.state.playerData).forEach(playerData => {
				if (playerData.out) return;
				let bonus = 0;
				playerData.wall.forEach(row => {
					if (row.every(cell => cell !== null)) bonus += BONUS_ROW;
				});
				for (let col = 0; col < 5; col++) {
					if (playerData.wall.every(row => row[col] !== null)) bonus += BONUS_COL;
				}
				TILES.forEach(color => {
					if (playerData.wall.every(row => row.some(cell => cell === color))) bonus += BONUS_COLOR;
				});
				playerData.score += bonus;
			});
			return this.end();
		}

		const starter = this.state.nextStarter ?? this.turns[0];
		this.state.nextStarter = null;
		this.state.round++;
		this.refillFactories();
		this.state.actionState = { action: VIEW_ACTION_TYPE.NONE };

		const starterIndex = this.turns.indexOf(starter);
		this.turn = this.turns[(starterIndex - 1 + this.turns.length) % this.turns.length];
		this.endTurn();
	}

	onEnd(type?: EndType): TranslatedText {
		if (type) {
			this.winCtx = { type };
			if (type === 'dq') return this.$T('GAME.ENDED_AUTOMATICALLY', { game: this.meta.name, id: this.id });
			return this.$T('GAME.ENDED', { game: this.meta.name, id: this.id });
		}
		const ranked = Object.values(this.state.playerData)
			.filter(p => !p.out)
			.sort((a, b) => {
				if (a.score !== b.score) return b.score - a.score;
				const rows = (p: PlayerBoard) => p.wall.filter(row => row.every(cell => cell !== null)).length;
				return rows(b) - rows(a);
			});
		const winner = ranked[0];
		this.winCtx = { type: 'win', winner, ranked };
		return this.$T('GAME.WON', { winner: winner.name });
	}

	render(side: Turn | null) {
		let view: ViewType;
		if (side) {
			if (side === this.turn) view = { type: 'player', active: true, self: side, ...this.state.actionState };
			else view = { type: 'player', active: false, self: side };
		} else {
			view = { type: 'spectator', active: false, action: this.winCtx ? VIEW_ACTION_TYPE.GAME_END : null };
		}

		const ctx: RenderCtx = {
			id: this.id,
			board: this.state.board,
			bag: this.state.bag,
			players: this.state.playerData,
			turns: this.turns,
			view,
			freeGrid: this.mod === AzulMods.FREE_GRID,
			round: this.state.round,
			ended: !!this.winCtx,
			$T: this.$T,
		};

		if (this.winCtx) {
			ctx.header = this.$T('GAME.GAME_ENDED');
		} else if (this.state.actionState.action === POST_TURN_ACTIONS.WALL && side === this.turn) {
			ctx.header = this.$T('GAME.AZUL.CHOOSE_WALL_COLUMN');
		} else if (this.state.actionState.action === VIEW_ACTION_TYPE.PLACE && side === this.turn) {
			ctx.header = this.$T('GAME.AZUL.SELECT_ROW');
		} else if (side === this.turn) {
			ctx.header = this.$T('GAME.YOUR_TURN');
		} else if (side) {
			ctx.header = this.$T('GAME.WAITING_FOR_PLAYER', { player: this.players[this.turn!].name });
			ctx.dimHeader = true;
		} else if (this.turn) {
			const current = this.players[this.turn];
			ctx.header = this.$T('GAME.WAITING_FOR_PLAYER', { player: `${current.name}${this.sides ? ` (${this.turn})` : ''}` });
		}
		return this.runRender(() => render.bind({ msg: this.msg })(ctx));
	}

	renderFinish() {
		return this.runRender(() =>
			render.bind({ msg: this.msg })({
				id: this.id,
				board: this.state.board,
				bag: this.state.bag,
				players: this.state.playerData,
				turns: this.turns,
				view: { type: 'spectator', active: false, action: VIEW_ACTION_TYPE.GAME_END },
				freeGrid: this.mod === AzulMods.FREE_GRID,
				round: this.state.round,
				ended: true,
				wallsOnly: true,
				header: this.$T('GAME.GAME_ENDED'),
				$T: this.$T,
			})
		);
	}
}
