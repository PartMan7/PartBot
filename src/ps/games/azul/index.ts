import { HSL } from 'ps-client/tools';

import { TOKEN_COLORS } from '@/ps/games/azul/constants';
import { render } from '@/ps/games/azul/render';
import { BaseGame } from '@/ps/games/game';
import { HslToHex } from '@/utils/color';
import { colorSampler } from '@/utils/colorSampler';
import { sample } from '@/utils/random';
import { range } from '@/utils/range';

import type { ToTranslate, TranslatedText } from '@/i18n/types';
import type { Log } from '@/ps/games/azul/logs';
import type { RenderCtx, State, WinCtx } from '@/ps/games/azul/types';
import type { BaseContext } from '@/ps/games/game';
import type { ActionResponse, EndType } from '@/ps/games/types';
import type { Hex } from '@/utils/color';
import type { User } from 'ps-client';

export { meta } from '@/ps/games/azul/meta';

export class Azul extends BaseGame<State> {
	log: Log[] = [];
	declare winCtx?: WinCtx | { type: EndType };

	constructor(ctx: BaseContext) {
		super(ctx);
		super.persist(ctx);

		if (ctx.backup) return;
		this.state.board = {};
	}

	onStart(): ActionResponse {
		const playerColors = Object.values(this.players).map<{ id: string; color: Hex }>(player => {
			const [H, S, L] = HSL(player.id).hsl;
			return { id: player.turn, color: HslToHex({ H, S, L, colorspace: 'hsla' }) };
		});

		const playerColorMappings = Object.fromEntries(colorSampler(playerColors, TOKEN_COLORS).map(({ id, assigned }) => [id, assigned]));

		Object.values(this.players).forEach(
			player => (this.state.board[player.id] = { pos: 0, name: player.name, color: playerColorMappings[player.turn] })
		);
		return { success: true, data: null };
	}

	onReplacePlayer(turn: string, withPlayer: User): ActionResponse {
		const oldBoardPlayer = this.state.board[turn];
		if (!oldBoardPlayer) return { success: false, error: 'Could not find old player' as ToTranslate };
		delete this.state.board[turn];
		this.state.board[withPlayer.id] = { ...oldBoardPlayer, name: withPlayer.name };
		return { success: true, data: null };
	}

	action(user: User): void {
		if (!this.started) this.throw('GAME.NOT_STARTED');
		if (user.id !== this.players[this.turn!].id) this.throw('GAME.IMPOSTOR_ALERT');
		this.roll();
	}

	roll(): void {
		const player = this.turn!;
		const current = this.state.board[player].pos;
		const dice = 1 + sample(6, this.prng);
		this.state.lastRoll = dice;
		if (current + dice > 100) {
			this.room.privateSend(
				player,
				`You rolled a ${dice}, but needed a ${100 - current}${100 - current === 1 ? '' : ' or lower'}...` as ToTranslate
			);
			this.endTurn();
			return;
		}

		let final = current + dice;
		const frameNums = range(current, final, dice + 1);
		const onSnekHead = this.snakes.find(snek => snek[0] === final);
		if (onSnekHead) {
			final = onSnekHead[1];
			frameNums.push(final);
		}
		const onLadderFoot = this.ladders.find(ladder => ladder[0] === final);
		if (onLadderFoot) {
			final = onLadderFoot[1];
			frameNums.push(final);
		}
		this.state.board[player].pos = final;

		this.log.push({ turn: player, time: new Date(), action: 'roll', ctx: dice });

		if (final === 100) {
			this.winCtx = { type: 'win', winner: { ...this.players[player], board: this.state.board } };
			return this.end();
		}

		this.frames = frameNums.map(pos => this.render(null, pos));

		this.endTurn();
	}

	update(user?: string): void {
		if (this.frames.length > 0) {
			if (user) return; // Don't send the page if animating
			this.room.pageHTML(
				[
					...Object.values(this.players)
						.filter(player => !player.out)
						.map(player => player.id),
					...this.spectators,
				],
				this.frames.shift(),
				{ name: this.id }
			);
			if (this.frames.length > 0) setTimeout(() => this.update(), 500);
			else setTimeout(() => super.update(), 500);
			return;
		} else super.update(user);
	}

	onEnd(type?: EndType): TranslatedText {
		if (type) {
			this.winCtx = { type };
			if (type === 'dq') return this.$T('GAME.ENDED_AUTOMATICALLY', { game: this.meta.name, id: this.id });
			return this.$T('GAME.ENDED', { game: this.meta.name, id: this.id });
		}
		return this.$T('GAME.WON', { winner: this.turn! });
	}

	render(side: string | null, override?: number) {
		const ctx: RenderCtx = {
			board:
				override && this.turn
					? { ...this.state.board, [this.turn]: { ...this.state.board[this.turn], pos: override } }
					: this.state.board,
			turns: this.turns,
			lastRoll: this.state.lastRoll,
			id: this.id,
			active: side === this.turn && !!side,
		};
		if (this.winCtx) {
			ctx.header = this.$T('GAME.GAME_ENDED');
		} else if (typeof override === 'number') {
			ctx.header = `${this.turn} rolled a ${this.state.lastRoll}...`;
		} else if (side === this.turn) {
			ctx.header = this.$T('GAME.YOUR_TURN');
		} else if (this.turn) {
			ctx.header = this.$T('GAME.WAITING_FOR_PLAYER', { player: this.players[this.turn].name });
			if (side) ctx.dimHeader = true;
		}
		return render.bind(this.renderCtx)(ctx);
	}
}
