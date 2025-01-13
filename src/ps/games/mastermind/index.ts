import { Game } from '@/ps/games/game';
import { render } from '@/ps/games/mastermind/render';
import { ChatError } from '@/utils/chatError';
import { sample } from '@/utils/random';

import type { EndType } from '@/ps/games/common';
import type { BaseContext } from '@/ps/games/game';
import type { Guess, GuessResult, State } from '@/ps/games/mastermind/types';
import type { User } from 'ps-client';

export { meta } from '@/ps/games/mastermind/meta';

export class Mastermind extends Game<State> {
	ended = false;

	constructor(ctx: BaseContext) {
		super(ctx);

		this.state.cap = parseInt(ctx.args.join(''));
		if (this.state.cap > 12 || this.state.cap < 4) throw new ChatError(this.$T('GAME.INVALID_INPUT'));
		super.persist(ctx);

		if (ctx.backup) return;
		this.state.board = [];
		this.state.solution = Array.from({ length: 4 }, () => sample(8, this.prng)) as Guess;
		if (isNaN(this.state.cap)) this.state.cap = 8;

		super.after(ctx);
	}
	action(user: User, ctx: string): void {
		if (!this.started) throw new ChatError(this.$T('GAME.NOT_STARTED'));
		if (!(user.id in this.players)) throw new ChatError(this.$T('GAME.IMPOSTOR_ALERT'));
		const guessStr = ctx.replace(/\s/g, '');
		if (!/^[0-7]{4}$/.test(guessStr)) throw new ChatError(this.$T('GAME.INVALID_INPUT'));
		const guess = guessStr.split('').map(n => +n) as Guess;
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

	onEnd(type: EndType): string {
		this.ended = true;
		const player = Object.values(this.players)[0].name;
		if (type === 'loss') {
			return `${player} was unable to guess ${this.state.solution.join('')} in ${this.state.cap} guesses.`;
		}
		const guesses = this.state.board.length;
		return `${player} guessed ${this.state.solution.join('')} in ${guesses} turn${guesses === 1 ? '' : 's'}!`;
	}

	render(asPlayer: string | null) {
		return render.bind(this.renderCtx)(this.state, asPlayer ? (this.ended ? 'over' : 'playing') : 'spectator');
	}
}
