import { EmbedBuilder } from 'discord.js';

import { WINNER_ICON } from '@/discord/constants/emotes';
import { BaseGame, createGrid } from '@/ps/games/game';
import { render } from '@/ps/games/othello/render';
import { deepClone } from '@/utils/deepClone';

import type { TranslatedText } from '@/i18n/types';
import type { BaseContext } from '@/ps/games/game';
import type { Log } from '@/ps/games/othello/logs';
import type { Board, RenderCtx, State, Turn, WinCtx } from '@/ps/games/othello/types';
import type { EndType } from '@/ps/games/types';
import type { User } from 'ps-client';

export { meta } from '@/ps/games/othello/meta';

export class Othello extends BaseGame<State> {
	log: Log[] = [];
	winCtx?: WinCtx | { type: EndType };
	cache: Record<string, Record<Turn, number>> = {};
	constructor(ctx: BaseContext) {
		super(ctx);
		super.persist(ctx);

		if (ctx.backup) return;
		const board = createGrid<Turn | null>(8, 8, () => null);
		board[3][3] = board[4][4] = 'W';
		board[3][4] = board[4][3] = 'B';
		this.state.board = board;
	}

	count(board = this.state.board): Record<Turn, number> {
		if (board === this.state.board && this.cache[this.log.length]) return this.cache[this.log.length];
		const count = board.flat(2).reduce(
			(acc, cell) => {
				if (cell) acc[cell]++;
				return acc;
			},
			{ B: 0, W: 0 }
		);
		if (board === this.state.board) this.cache[this.log.length] = count;
		return count;
	}

	action(user: User, ctx: string): void {
		if (!this.started) this.throw('GAME.NOT_STARTED');
		if (user.id !== this.players[this.turn!].id) this.throw('GAME.IMPOSTOR_ALERT');
		const [i, j] = ctx.split('-').map(num => parseInt(num));
		if (isNaN(i) || isNaN(j)) this.throw();
		const res = this.play([i, j], this.turn!);
		if (!res) this.throw();
	}

	play([i, j]: [number, number], turn: Turn): Board | null;
	play([i, j]: [number, number], turn: Turn, board: Board): boolean;
	play([i, j]: [number, number], turn: Turn, board = this.state.board): Board | null | boolean {
		const isActual = board === this.state.board;
		const other = this.getNext(turn);
		if (isActual && this.turn !== turn) this.throw('GAME.IMPOSTOR_ALERT');

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
		this.log.push({ action: 'play', time: new Date(), turn, ctx: [i, j] });

		const next = this.nextPlayer();
		if (!next) this.end();
		return board;
	}

	hasMoves(turn = this.turn!): boolean {
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
				if (this.play([i, j], this.turn!, board)) moves.push([i, j]);
			}
		}
		return moves;
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
		const scores = this.count();
		if (scores.W === scores.B) {
			this.winCtx = { type: 'draw' };
			return this.$T('GAME.DRAW', { players: [this.players.W.name, this.players.B.name].list(this.$T) });
		}
		const winningSide = scores.W > scores.B ? 'W' : 'B';
		const winner = this.players[winningSide];
		const loser = this.players[this.getNext(winningSide)];
		this.winCtx = {
			type: 'win',
			winner: { ...winner, score: scores[winningSide] },
			loser: { ...loser, score: scores[this.getNext(winningSide)] },
		};
		return this.$T('GAME.WON_AGAINST', {
			winner: `${winner.name} (${winningSide})`,
			game: this.meta.name,
			loser: `${loser.name} (${this.getNext(winningSide)})`,
			ctx: ` [${scores[winningSide]}-${scores[this.getNext(winningSide)]}]`,
		});
	}

	async renderEmbed(): Promise<EmbedBuilder> {
		const winner = this.winCtx && this.winCtx.type === 'win' ? this.winCtx.winner.id : null;
		const title = Object.values(this.players)
			.map(player => `${player.name} (${player.turn})${player.id === winner ? ` ${WINNER_ICON}` : ''}`)
			.join(' vs ');
		const count = this.count();
		return new EmbedBuilder()
			.setColor('#008000')
			.setAuthor({ name: 'Othello - Room Match' })
			.setTitle(title)
			.setURL(await this.getURL())
			.addFields([
				{
					name: [count.B, count.W].join(' - '),
					value: this.state.board
						.map(row => row.map(cell => (cell ? { B: ':black_circle:', W: ':white_circle:' }[cell] : ':green_circle:')).join(''))
						.join('\n'),
				},
			]);
	}

	render(side: Turn | null) {
		const ctx: RenderCtx = {
			board: this.state.board,
			validMoves: side === this.turn ? this.validMoves() : [],
			score: this.count(),
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
		return render.bind(this.renderCtx)(ctx);
	}
}
