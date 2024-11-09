import { Game, BaseContext, createGrid } from '@/ps/games/game';
import type { Board, State, Turn, RenderCtx, WinCtx } from '@/ps/games/othello/types';
import { Room } from 'ps-client';

import { deepClone } from '@/utils/deepClone';
import { render } from '@/ps/games/othello/render';
import { GAME } from '@/text';

export class Othello extends Game<State, null> {
	winCtx: WinCtx;
	constructor(ctx: BaseContext) {
		super(ctx);

		this.turns = ['B', 'W'];

		const board = createGrid(8, 8, () => null);
		board[3][3] = board[4][4] = 'W';
		board[3][4] = board[4][3] = 'B';
		this.state.board = board;
	}

	count(board = this.state.board): Record<Turn, number> {
		return board.flat(2).reduce(
			(acc, cell) => {
				if (cell) acc[cell]++;
				return acc;
			},
			{ W: 0, B: 0 }
		);
	}

	play([i, j]: [number, number], turn: Turn): Board | null;
	play([i, j]: [number, number], turn: Turn, board: Board): boolean;
	play([i, j]: [number, number], turn: Turn, board = this.state.board): Board | null | boolean {
		// TODO: check if the right turn
		const isActual = board === this.state.board;
		const other = this.next(turn);

		if (board[i][j]) return null;

		let flipped = false;

		for (let X = -1; X <= 1; X++) {
			for (let Y = -1; Y <= 1; Y++) {
				if (!X && !Y) continue;
				for (let m = i, n = j; m < 8 && n < 8 && m >= 0 && n >= 0; m += X, n += Y) {
					if (m === i && n === j) continue;
					if (!board[m][n]) break; // Gap
					if (board[m][n] === other) continue; // Continue flipping!
					for (let x = i, y = j; x < 8 && y < 8 && x >= 0 && y >= 0; x += X, y += Y) {
						if (x === i && y === j) continue;
						if (board[x][y] === other) {
							flipped = true;
							if (!isActual) return true;
							else board[x][y] = turn;
						} else break;
					}
				}
			}
		}
		if (!isActual) return false;
		if (!flipped) return null;
		board[i][j] = turn;
		this.log += `[${i},${j}]`;

		const next = this.nextPlayer();
		if (!next) this.end();
		return board;
	}

	hasMoves(turn = this.turn): boolean {
		const board = deepClone(this.state.board);
		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				if (this.play([i, j], turn, board)) return true;
			}
		}
		return false;
	}

	validMoves(): [number, number][] {
		const board = deepClone(this.state.board);
		const moves: [number, number][] = [];
		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				if (this.play([i, j], this.turn, board)) moves.push([i, j]);
			}
		}
		return moves;
	}

	trySkipPlayer(turn: Turn) {
		return !this.hasMoves(turn);
	}

	onEnd(): string {
		const scores = this.count();
		if (scores.W === scores.B) {
			this.winCtx = { type: 'draw' };
			return GAME.DRAW(this.players.W.name, this.players.B.name);
		}
		const winningSide = scores.W > scores.B ? 'W' : 'B';
		const winner = this.players[winningSide];
		const loser = this.players[this.next(winningSide)];
		this.winCtx = {
			type: 'win',
			winner: { ...winner, score: scores[winningSide] },
			loser: { ...loser, score: scores[this.next(winningSide)] },
		};
		return GAME.WON_AGAINST(
			`${winner.name} (${winningSide})`,
			`${loser.name} (${this.next(winningSide)})`,
			this.game,
			`${scores[winningSide]}-${scores[this.next(winningSide)]}`
		);
	}

	render(side) {
		const ctx: RenderCtx = { board: this.state.board, validMoves: side === this.turn ? this.validMoves() : [] };
		return render.bind(this.renderCtx)(ctx);
	}
}

const index = new Othello({ room: 'room' as unknown as Room, id: 'id', game: 'othello' });
