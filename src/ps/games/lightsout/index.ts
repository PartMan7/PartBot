import { type ReactElement } from 'react';

import { BaseGame } from '@/ps/games/game';
import { render, renderCloseSignups } from '@/ps/games/lightsout/render';
import { createGrid } from '@/ps/games/utils';
import { isUGOActive } from '@/ps/ugo';
import { deepClone } from '@/utils/deepClone';
import { type Point, parsePoint, stepPoint } from '@/utils/grid';

import type { ToTranslate, TranslatedText } from '@/i18n/types';
import type { BaseContext } from '@/ps/games/game';
import type { State } from '@/ps/games/lightsout/types';
import type { EndType } from '@/ps/games/types';
import type { User } from 'ps-client';

export { meta } from '@/ps/games/lightsout/meta';

export class LightsOut extends BaseGame<State> {
	ended = false;
	size: [number, number];
	setBy: User | null = null;

	constructor(ctx: BaseContext) {
		super(ctx);

		const passedSize = parsePoint(ctx.args.join(' '));
		this.size = (passedSize ?? [5, 5]).reverse() as [number, number]; // more intuitive to have width x height than X x Y
		this.state.board = createGrid<boolean>(...this.size, () => false);

		if (this.size.some(size => size < 2 || size > 15))
			this.throw('GAME.LIGHTS_OUT.INVALID_SIZE');

		super.persist(ctx);

		this.state.clicks = 0;
		this.state.genClicks = 0;
		this.state.board.forEach((row, i) => {
			row.forEach((_cell, j) => {
				if ([true, false].random(this.prng)) {
					this.click(i, j);
					this.state.genClicks++;
				}
			});
		});
		this.state.original = deepClone(this.state.board);

		super.after(ctx);
	}
	renderCloseSignups(): ReactElement {
		return renderCloseSignups.bind(this)();
	}

	canBroadcastFinish(): boolean {
		// UGO-CODE
		if (isUGOActive()) return false;
		return this.size[0] * this.size[1] >= 25;
	}

	click(a: number, b: number): void {
		const [x, y] = this.size;
		if (!(a < x && a >= 0 && b < y && b >= 0)) this.throw();

		const board = this.state.board;

		for (const offset of <Point[]>[
			[0, 0],
			[1, 0],
			[0, 1],
			[-1, 0],
			[0, -1],
		]) {
			const target = stepPoint([a, b], offset);
			if (typeof board[target[0]]?.[target[1]] === 'boolean') {
				board[target[0]][target[1]] = !board[target[0]][target[1]];
			}
		}
	}

	action(user: User, ctx: string): void {
		if (!this.started) this.throw('GAME.NOT_STARTED');
		if (!(user.id in this.players)) this.throw('GAME.IMPOSTOR_ALERT');

		const clickTarget = parsePoint(ctx);
		if (!clickTarget) this.throw();
		this.click(...clickTarget);
		this.state.clicks++;
		if (this.state.board.every(row => row.every(cell => cell === false))) {
			return this.end();
		}
		this.endTurn();
	}

	onEnd(type: Exclude<EndType, 'loss'>): TranslatedText {
		this.ended = true;
		const player = Object.values(this.players)[0].name;
		if (type === 'dq' || type === 'force') return this.$T('GAME.ENDED', { game: this.meta.name, id: player });
		return `${player} solved this board in ${this.state.clicks} moves! (My solution was ${this.state.genClicks} moves)` as ToTranslate;
	}

	render(asPlayer: string | null): ReactElement {
		return render.bind(this.renderCtx)(this.state, {
			size: this.size,
			player: !!asPlayer,
			ended: this.ended,
			genClicks: this.state.genClicks,
		});
	}
}
