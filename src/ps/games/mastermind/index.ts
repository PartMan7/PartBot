import { type ReactElement } from 'react';

import { Game } from '@/ps/games/game';
import { render, renderCloseSignups } from '@/ps/games/mastermind/render';
import { sample } from '@/utils/random';

import type { ToTranslate, TranslatedText } from '@/i18n/types';
import type { EndType } from '@/ps/games/common';
import type { BaseContext } from '@/ps/games/game';
import type { Guess, GuessResult, State } from '@/ps/games/mastermind/types';
import type { User } from 'ps-client';

export { meta } from '@/ps/games/mastermind/meta';

export class Mastermind extends Game<State> {
	ended = false;
	setBy: User | null = null;

	constructor(ctx: BaseContext) {
		super(ctx);

		this.state.cap = parseInt(ctx.args.join(''));
		if (this.state.cap > 12 || this.state.cap < 4) this.throw();
		if (isNaN(this.state.cap)) this.state.cap = 10;
		super.persist(ctx);

		if (ctx.backup) return;
		this.state.board = [];
		this.state.solution = Array.from({ length: 4 }, () => sample(8, this.prng)) as Guess;

		super.after(ctx);
	}
	renderCloseSignups(): ReactElement {
		return renderCloseSignups.bind(this)();
	}

	parseGuess(guess: string): Guess {
		const guessStr = guess.replace(/\s/g, '');
		if (!/^[0-7]{4}$/.test(guessStr)) this.throw();
		return guessStr.split('').map(n => +n) as Guess;
	}

	action(user: User, ctx: string): void {
		if (!this.started) this.throw('GAME.NOT_STARTED');
		if (!(user.id in this.players)) this.throw('GAME.IMPOSTOR_ALERT');

		const guess = this.parseGuess(ctx);
		const result = this.guess(guess);
		this.state.board.push({ guess, result });
		if (result.exact === this.state.solution.length) {
			return this.end();
		}
		if (this.state.board.length >= this.state.cap) {
			return this.end('loss');
		}
		this.nextPlayer();
	}
	guess(guess: Guess): GuessResult {
		if (this.state.board.length === 0 && !this.setBy) this.closeSignups();

		const solCount = this.state.solution.count();
		const guessCount = guess.count();
		let exact = 0;
		for (let i = 0; i < 4; i++) {
			const digit = this.state.solution[i];
			if (guess[i] === digit) {
				exact++;
				solCount[digit]--;
				guessCount[digit]--;
			}
		}
		let moved = 0;
		for (const digit in solCount) {
			if (guessCount[digit]) moved += Math.min(guessCount[digit], solCount[digit]);
		}
		return { exact, moved };
	}
	external(user: User, ctx: string): void {
		if (this.state.board.length > 0) this.throw('GAME.ALREADY_STARTED');
		if (this.setBy) this.throw('TOO_LATE');
		if (user.id in this.players) this.throw('GAME.IMPOSTOR_ALERT');

		this.state.solution = this.parseGuess(ctx);
		this.setBy = user;
		this.closeSignups();
	}

	onEnd(type: EndType): TranslatedText {
		this.ended = true;
		const player = Object.values(this.players)[0].name;
		if (type === 'dq' || type === 'force') return this.$T('GAME.MASTERMIND.ENDED', { player });
		if (type === 'loss')
			return this.$T('GAME.MASTERMIND.FAILED', { player, solution: this.state.solution.join(''), cap: this.state.cap });
		const guesses = this.state.board.length;
		return `${player} guessed ${this.state.solution.join('')} in ${guesses} turn${guesses === 1 ? '' : 's'}!` as ToTranslate;
	}

	render(asPlayer: string | null): ReactElement {
		return render.bind(this.renderCtx)(this.state, asPlayer ? (this.ended ? 'over' : 'playing') : 'spectator');
	}
}
