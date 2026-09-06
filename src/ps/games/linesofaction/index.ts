import { EmbedBuilder } from 'discord.js';

import { WINNER_ICON } from '@/discord/constants/emotes';
import { BaseGame } from '@/ps/games/game';
import { render } from '@/ps/games/linesofaction/render';
import { createGrid } from '@/ps/games/utils';

import type { TranslatedText } from '@/i18n/types';
import type { BaseContext } from '@/ps/games/game';
import type { Log } from '@/ps/games/linesofaction/logs';
import type { Board, Move, RenderCtx, State, Turn, WinCtx } from '@/ps/games/linesofaction/types';
import type { EndType } from '@/ps/games/types';
import type { User } from 'ps-client';

export { meta } from '@/ps/games/linesofaction/meta';

const DIRECTIONS: [number, number][] = [
	[-1, -1],
	[-1, 0],
	[-1, 1],
	[0, -1],
	[0, 1],
	[1, -1],
	[1, 0],
	[1, 1],
];

function createInitialBoard(): Board {
	const board = createGrid<Turn | null>(8, 8, () => null);
	for (let j = 1; j <= 6; j++) {
		board[0][j] = 'B';
		board[7][j] = 'B';
	}
	for (let i = 1; i <= 6; i++) {
		board[i][0] = 'W';
		board[i][7] = 'W';
	}
	return board;
}

function countOnLine(board: Board, i: number, j: number, di: number, dj: number): number {
	let count = 0;
	for (let x = i, y = j; x >= 0 && x < 8 && y >= 0 && y < 8; x += di, y += dj) {
		if (board[x][y]) count++;
	}
	for (let x = i - di, y = j - dj; x >= 0 && x < 8 && y >= 0 && y < 8; x -= di, y -= dj) {
		if (board[x][y]) count++;
	}
	return count;
}

function isPathClear(board: Board, from: [number, number], to: [number, number], turn: Turn): boolean {
	const di = Math.sign(to[0] - from[0]);
	const dj = Math.sign(to[1] - from[1]);
	for (let x = from[0] + di, y = from[1] + dj; x !== to[0] || y !== to[1]; x += di, y += dj) {
		const cell = board[x][y];
		if (cell && cell !== turn) return false;
	}
	return true;
}

function getMovesForPiece(board: Board, from: [number, number], turn: Turn): Move[] {
	const [i, j] = from;
	if (board[i][j] !== turn) return [];

	const moves: Move[] = [];
	for (const [di, dj] of DIRECTIONS) {
		const distance = countOnLine(board, i, j, di, dj);
		if (!distance) continue;

		const to: [number, number] = [i + di * distance, j + dj * distance];
		if (to[0] < 0 || to[0] >= 8 || to[1] < 0 || to[1] >= 8) continue;

		const dest = board[to[0]][to[1]];
		if (dest === turn) continue;
		if (!isPathClear(board, from, to, turn)) continue;

		moves.push({ from, to });
	}
	return moves;
}

function isConnected(board: Board, turn: Turn): boolean {
	const pieces: [number, number][] = [];
	for (let i = 0; i < 8; i++) {
		for (let j = 0; j < 8; j++) {
			if (board[i][j] === turn) pieces.push([i, j]);
		}
	}
	if (pieces.length <= 1) return true;

	const visited = new Set<string>();
	const queue = [pieces[0]];
	visited.add(`${pieces[0][0]},${pieces[0][1]}`);

	while (queue.length) {
		const [i, j] = queue.pop()!;
		for (const [di, dj] of DIRECTIONS) {
			const ni = i + di;
			const nj = j + dj;
			const key = `${ni},${nj}`;
			if (ni < 0 || ni >= 8 || nj < 0 || nj >= 8 || board[ni][nj] !== turn || visited.has(key)) continue;
			visited.add(key);
			queue.push([ni, nj]);
		}
	}
	return visited.size === pieces.length;
}

function getAllMoves(board: Board, turn: Turn): Move[] {
	const moves: Move[] = [];
	for (let i = 0; i < 8; i++) {
		for (let j = 0; j < 8; j++) {
			if (board[i][j] !== turn) continue;
			moves.push(...getMovesForPiece(board, [i, j], turn));
		}
	}
	return moves;
}

export class LinesOfAction extends BaseGame<State> {
	log: Log[] = [];
	declare winCtx?: WinCtx | { type: EndType };
	selected: [number, number] | null = null;
	validMoves: Move[] = [];

	constructor(ctx: BaseContext) {
		super(ctx);
		super.persist(ctx);

		if (ctx.backup) return;
		this.state.board = createInitialBoard();
	}

	parseCoords(ctx: string): [number, number] | null {
		const [i, j] = ctx.split('-').map(num => parseInt(num));
		if (isNaN(i) || isNaN(j) || i < 0 || i >= 8 || j < 0 || j >= 8) return null;
		return [i, j];
	}

	cleanup() {
		this.selected = null;
		this.validMoves = [];
	}

	select(from: [number, number]) {
		if (this.state.board[from[0]][from[1]] !== this.turn) this.throw();
		if (this.selected?.[0] === from[0] && this.selected?.[1] === from[1]) {
			this.cleanup();
		} else {
			this.selected = from;
			this.validMoves = getMovesForPiece(this.state.board, from, this.turn!);
		}
		this.update(this.players[this.turn!].id);
	}

	action(user: User, ctx: string): void {
		if (!this.started) this.throw('GAME.NOT_STARTED');
		if (user.id !== this.players[this.turn!].id) this.throw('GAME.IMPOSTOR_ALERT');

		const [actionType, action] = ctx.lazySplit(' ', 1);
		switch (actionType) {
			case 'select': {
				const from = this.parseCoords(action);
				if (!from) this.throw();
				this.select(from);
				break;
			}
			case 'move': {
				const parts = action.split('-').map(num => parseInt(num));
				if (parts.length !== 4 || parts.some(num => isNaN(num))) this.throw();
				const from: [number, number] = [parts[0], parts[1]];
				const to: [number, number] = [parts[2], parts[3]];
				if (!this.play({ from, to }, this.turn!)) this.throw();
				break;
			}
			default:
				this.throw();
		}
	}

	play(move: Move, turn: Turn): Board | null;
	play(move: Move, turn: Turn, board: Board): boolean;
	play(move: Move, turn: Turn, board = this.state.board): Board | null | boolean {
		const isActual = board === this.state.board;
		if (isActual && this.turn !== turn) this.throw('GAME.IMPOSTOR_ALERT');

		const { from, to } = move;
		if (board[from[0]][from[1]] !== turn) return isActual ? null : false;

		const legal = getMovesForPiece(board, from, turn);
		if (!legal.some(({ to: [ti, tj] }) => ti === to[0] && tj === to[1])) return isActual ? null : false;

		const capture = board[to[0]][to[1]];
		board[to[0]][to[1]] = turn;
		board[from[0]][from[1]] = null;

		if (!isActual) return true;

		this.log.push({
			action: 'play',
			time: new Date(),
			turn,
			ctx: capture ? { from, to, capture } : { from, to },
		});
		this.cleanup();

		const moverConnected = isConnected(board, turn);
		const opponent = this.getNext(turn);
		const opponentConnected = isConnected(board, opponent);

		if (moverConnected || opponentConnected) {
			if (moverConnected && opponentConnected) {
				this.winCtx = { type: 'win', winner: this.players[turn], loser: this.players[opponent] };
			} else if (moverConnected) {
				this.winCtx = { type: 'win', winner: this.players[turn], loser: this.players[opponent] };
			} else {
				this.winCtx = { type: 'win', winner: this.players[opponent], loser: this.players[turn] };
			}
			this.end();
			return board;
		}

		const next = this.endTurn();
		if (!next) this.end();
		return board;
	}

	hasMoves(turn = this.turn!): boolean {
		return getAllMoves(this.state.board, turn).length > 0;
	}

	trySkipPlayer(turn: Turn) {
		return !this.hasMoves(turn);
	}

	onEnd(type?: EndType): TranslatedText {
		if (type) {
			this.winCtx = { type };
			if (type === 'dq') return this.$T('GAME.ENDED_AUTOMATICALLY', { game: this.meta.name, id: this.id });
			return this.$T('GAME.ENDED', { game: this.meta.name, id: this.id });
		}
		if (this.winCtx?.type === 'draw') {
			return this.$T('GAME.DRAW', { players: [this.players.B.name, this.players.W.name].list(this.$T) });
		}
		if (this.winCtx?.type === 'win') {
			return this.$T('GAME.WON_AGAINST', {
				winner: `${this.winCtx.winner.name} (${this.winCtx.winner.turn})`,
				game: this.meta.name,
				loser: `${this.winCtx.loser.name} (${this.winCtx.loser.turn})`,
				ctx: '',
			});
		}
		throw new Error(`winCtx not defined for LoA - ${JSON.stringify(this.winCtx)}`);
	}

	async renderEmbed(): Promise<EmbedBuilder> {
		const winner = this.winCtx?.type === 'win' ? this.winCtx.winner.id : null;
		const title = Object.values(this.players)
			.map(player => `${player.name} (${player.turn})${player.id === winner ? ` ${WINNER_ICON}` : ''}`)
			.join(' vs ');
		return new EmbedBuilder()
			.setColor('#4a3728')
			.setAuthor({ name: 'Lines of Action - Room Match' })
			.setTitle(title)
			.setURL(await this.getURL())
			.addFields([
				{
					name: '\u200b',
					value: this.state.board
						.map(row => row.map(cell => (cell ? { B: ':black_circle:', W: ':white_circle:' }[cell] : ':brown_circle:')).join(''))
						.join('\n'),
				},
			]);
	}

	render(side: Turn | null) {
		const ctx: RenderCtx = {
			board: this.state.board,
			turn: side === this.turn ? this.turn : null,
			selected: side === this.turn ? this.selected : null,
			validMoves: side === this.turn ? this.validMoves : [],
			id: this.id,
		};
		if (this.winCtx) {
			ctx.header = this.$T('GAME.GAME_ENDED');
		} else if (side === this.turn) {
			ctx.header = this.$T('GAME.YOUR_TURN');
		} else if (side) {
			ctx.header = this.$T('GAME.WAITING_FOR_OPPONENT');
			ctx.dimHeader = true;
		} else if (this.turn) {
			const current = this.players[this.turn];
			ctx.header = this.$T('GAME.WAITING_FOR_PLAYER', { player: `${current.name}${this.sides ? ` (${this.turn})` : ''}` });
		}
		return this.runRender(() => render.bind({ msg: this.msg })(ctx));
	}
}
