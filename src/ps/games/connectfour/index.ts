import { EmbedBuilder } from 'discord.js';

import { WINNER_ICON } from '@/discord/constants/emotes';
import { render } from '@/ps/games/connectfour/render';
import { Game, createGrid } from '@/ps/games/game';
import { repeat } from '@/utils/repeat';

import type { TranslatedText } from '@/i18n/types';
import type { EndType } from '@/ps/games/common';
import type { Log } from '@/ps/games/connectfour/logs';
import type { Board, RenderCtx, State, Turn, WinCtx } from '@/ps/games/connectfour/types';
import type { BaseContext } from '@/ps/games/game';
import type { User } from 'ps-client';
import type { ReactElement } from 'react';

export { meta } from '@/ps/games/connectfour/meta';

export class ConnectFour extends Game<State> {
	log: Log[] = [];
	winCtx?: WinCtx | { type: EndType };
	cache: Record<string, Record<Turn, number>> = {};
	constructor(ctx: BaseContext) {
		super(ctx);
		super.persist(ctx);

		if (ctx.backup) return;
		this.state.board = createGrid<Turn | null>(6, 7, () => null);
	}

	action(user: User, ctx: string): void {
		if (!this.started) this.throw('GAME.NOT_STARTED');
		if (user.id !== this.players[this.turn!].id) this.throw('GAME.IMPOSTOR_ALERT');
		const col = parseInt(ctx);
		if (isNaN(col)) this.throw();
		const res = this.play(col, this.turn!);
		if (!res) this.throw();
	}

	play(col: number, turn: Turn): Board | null | boolean {
		if (this.turn !== turn) this.throw('GAME.IMPOSTOR_ALERT');
		const board = this.state.board;

		if (board[0][col]) return null;
		board[board.findLastIndex(row => !row[col])][col] = turn;
		this.log.push({ action: 'play', time: new Date(), turn, ctx: col });

		if (this.won(col, turn)) {
			const other = this.getNext(turn);
			this.winCtx = { type: 'win', winner: this.players[turn], loser: this.players[other] };
			this.end();
			return true;
		}
		if (board[0].every(cell => !!cell)) {
			// board full
			this.winCtx = { type: 'draw' };
			this.end();
			return true;
		}
		this.nextPlayer();
		return board;
	}

	won(col: number, turn: Turn): boolean {
		const board = this.state.board;
		const directions = [
			[0, 1], // horizontal
			[1, 0], // vertical
			[1, 1], // NE
			[-1, 1], // SE
		];
		const Y = col;
		const X = board.findLastIndex(row => !row[col]) + 1;
		const offsets = repeat(null, 2 * 4 - 1).map((_, i) => i - 4 + 1);
		for (const dir of directions) {
			let streak = 0;
			for (const offset of offsets) {
				const x = X + offset * dir[0];
				const y = Y + offset * dir[1];
				if (board[x]?.[y] === turn) streak++;
				else streak = 0;
				if (streak >= 4) return true;
			}
		}
		return false;
	}

	onEnd(type?: EndType): TranslatedText {
		if (type) {
			this.winCtx = { type };
			if (type === 'dq') return this.$T('GAME.ENDED_AUTOMATICALLY', { game: this.meta.name, id: this.id });
			return this.$T('GAME.ENDED', { game: this.meta.name, id: this.id });
		}
		if (this.winCtx?.type === 'draw') {
			return this.$T('GAME.DRAW', { players: [this.players.Y.name, this.players.R.name].list(this.$T) });
		}
		if (this.winCtx && this.winCtx.type === 'win')
			return this.$T('GAME.WON_AGAINST', {
				winner: `${this.winCtx.winner.name} (${this.winCtx.winner.turn})`,
				game: this.meta.name,
				loser: `${this.winCtx.loser.name} (${this.winCtx.loser.turn})`,
				ctx: '',
			});
		throw new Error(`winCtx not defined for C4 - ${JSON.stringify(this.winCtx)}`);
	}

	renderEmbed(): EmbedBuilder {
		const winner = this.winCtx && this.winCtx.type === 'win' ? this.winCtx.winner.id : null;
		const title = Object.values(this.players)
			.map(player => `${player.name} (${player.turn})${player.id === winner ? ` ${WINNER_ICON}` : ''}`)
			.join(' vs ');
		return (
			new EmbedBuilder()
				.setColor('#0080FF')
				.setAuthor({ name: 'Connect Four - Room Match' })
				.setTitle(title)
				// .setURL // TODO: Link game logs on Web
				.addFields([
					{
						name: '\u200b',
						value: this.state.board
							.map(row => row.map(cell => (cell ? { R: ':red_circle:', Y: ':yellow_circle:' }[cell] : ':blue_circle:')).join(''))
							.join('\n'),
					},
				])
		);
	}

	render(side: Turn | null): ReactElement {
		const ctx: RenderCtx = {
			board: this.state.board,
			id: this.id,
		};
		if (this.winCtx) {
			ctx.header = 'Game ended.';
		} else if (side === this.turn) {
			ctx.header = 'Your turn!';
		} else if (side) {
			ctx.header = 'Waiting for opponent...';
			ctx.dimHeader = true;
		} else if (this.turn) {
			const current = this.players[this.turn];
			ctx.header = `Waiting for ${current.name}${this.sides ? ` (${this.turn})` : ''}...`;
		}
		return render.bind(this.renderCtx)(ctx);
	}
}
