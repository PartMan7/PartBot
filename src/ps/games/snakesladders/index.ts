import { HSL } from 'ps-client/tools';

import { BaseGame } from '@/ps/games/game';
import { TOKEN_COLORS } from '@/ps/games/snakesladders/constants';
import { render } from '@/ps/games/snakesladders/render';
import { isAprilFoolsActive } from '@/ps/specialEvents';
import { HslToHex } from '@/utils/color';
import { colorSampler } from '@/utils/colorSampler';
import { sample } from '@/utils/random';
import { range } from '@/utils/range';

import type { NoTranslate, TranslatedText } from '@/i18n/types';
import type { BaseContext, GameUser } from '@/ps/games/game';
import type { Log } from '@/ps/games/snakesladders/logs';
import type { RenderCtx, State, WinCtx } from '@/ps/games/snakesladders/types';
import type { ActionResponse, EndType } from '@/ps/games/types';
import type { Hex } from '@/utils/color';

export { meta } from '@/ps/games/snakesladders/meta';

export class SnakesLadders extends BaseGame<State> {
	log: Log[] = [];
	declare winCtx?: WinCtx | { type: EndType };

	ladders: [number, number][] = [
		[1, 38],
		[4, 14],
		[8, 30],
		[21, 42],
		[28, 76],
		[50, 67],
		[71, 92],
		[80, 99],
	];
	snakes: [number, number][] = [
		[32, 10],
		[36, 6],
		[48, 26],
		[62, 18],
		[88, 24],
		[95, 56],
		[97, 78],
	];

	constructor(ctx: BaseContext) {
		super(ctx);
		super.persist(ctx);

		if (ctx.backup) return;
		this.state.board = {};
		this.state.lastRoll = 0;
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
		if (isAprilFoolsActive()) this.room.send('NOW PLAYING: STAKES AND ADDERS!' as NoTranslate);
		return { success: true, data: null };
	}

	onReplacePlayer(turn: string, withPlayer: GameUser): ActionResponse {
		const oldBoardPlayer = this.state.board[turn];
		if (!oldBoardPlayer) return { success: false, error: this.$T('GAME.SNAKESLADDERS.PLAYER_NOT_FOUND') };
		delete this.state.board[turn];
		this.state.board[withPlayer.id] = { ...oldBoardPlayer, name: withPlayer.name };
		return { success: true, data: null };
	}

	action(user: GameUser): void {
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
			const needed = 100 - current;
			this.room.privateSend(
				player,
				this.$T(needed === 1 ? 'GAME.SNAKESLADDERS.ROLL_TOO_HIGH_EXACT' : 'GAME.SNAKESLADDERS.ROLL_TOO_HIGH', {
					dice,
					needed,
				})
			);
			this.endTurn();
			return;
		}

		let final = current + dice;
		const frameNums = range(current, final, dice + 1);

		// on AFD, we go from entry[1] to entry[0] instead of the other way around
		const fromIndex = isAprilFoolsActive() ? 1 : 0;
		const toIndex = fromIndex === 0 ? 1 : 0;

		const onSnekHead = this.snakes.find(snek => snek[fromIndex] === final);
		if (onSnekHead) {
			final = onSnekHead[toIndex];
			frameNums.push(final);
		}
		const onLadderFoot = this.ladders.find(ladder => ladder[fromIndex] === final);
		if (onLadderFoot) {
			final = onLadderFoot[toIndex];
			frameNums.push(final);
		}
		this.state.board[player].pos = final;

		this.log.push({ turn: player, time: new Date(), action: 'roll', ctx: dice });

		if (final === 100) {
			this.winCtx = { type: 'win', winner: { ...this.players[player], board: this.state.board } };
			return this.end();
		}

		this.queueAnimation(frameNums.map(pos => this.render(null, pos)));

		this.endTurn();
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
			...(typeof override === 'number' ? { header: `${this.turn} rolled a ${this.state.lastRoll}...` } : this.getHeader(side)),
		};
		return this.runRender(() => render(ctx));
	}
}
