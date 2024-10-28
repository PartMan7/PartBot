import { sample, useRNG, RNGSource } from 'utils/random';

declare global {
	interface Array<T> {
		random(rng?: RNGSource): T;
		sample(amount: number, rng?: RNGSource): T[];
		remove(...toRemove: T[]): T[];
		shuffle(rng?: RNGSource): T[];
		filterMap<X>(cb: (element: T, index: number, thisArray: T[]) => X | undefined): X | undefined;
		unique(): T[];
	}

	interface String {
		lazySplit(match: string | RegExp, cases: number): string[];
		gsub(match: RegExp, replace: string | ((arg: string, ...captures: string[]) => string)): string;
	}
}

Object.defineProperties(Array.prototype, {
	filterMap: {
		enumerable: false,
		writable: false,
		configurable: false,
		value: function <X, T = unknown>(
			this: T[],
			callback: (element: T, index: number, thisArray: T[]) => X | undefined
		): X | undefined {
			for (let i = 0; i < this.length; i++) {
				const result = callback(this[i], i, this);
				if (result === undefined) continue;
				return result;
			}
		},
	},
	remove: {
		enumerable: false,
		writable: false,
		configurable: false,
		value: function <T = unknown>(this: T[], ...terms: T[]): boolean {
			let out = true;
			terms.forEach(term => {
				if (this.indexOf(term) >= 0) this.splice(this.indexOf(term), 1);
				else out = false;
			});
			return out;
		},
	},
	random: {
		enumerable: false,
		writable: false,
		configurable: false,
		value: function <T = unknown>(this: T[], rng?: RNGSource): T {
			return this[sample(this.length, useRNG(rng))];
		},
	},
	sample: {
		enumerable: false,
		writable: false,
		configurable: false,
		value: function T<T = unknown>(this: T[], amount: number, rng?: RNGSource): T[] {
			const RNG = useRNG(rng);
			const sample = Array.from(this),
				out: T[] = [];
			let i = 0;
			while (sample.length && i++ < amount) {
				const term = sample[Math.floor(RNG() * sample.length)];
				out.push(term);
				sample.remove(term);
			}
			return out;
		},
	},
	shuffle: {
		enumerable: false,
		writable: false,
		configurable: false,
		value: function <T = unknown>(this: T[], rng?: RNGSource): T[] {
			const RNG = useRNG(rng);
			for (let i = this.length - 1; i > 0; i--) {
				const j = Math.floor(RNG() * (i + 1));
				[this[i], this[j]] = [this[j], this[i]];
			}
			return Array.from(this);
		},
	},
	unique: {
		enumerable: false,
		writable: false,
		configurable: false,
		value: function <T = unknown>(this: T[]): T[] {
			const output = [];
			const cache = new Set();
			for (let i = 0; i < this.length; i++) {
				if (!cache.has(this[i])) {
					cache.add(this[i]);
					output.push(this[i]);
				}
			}
			return output;
		},
	},
});

Object.defineProperties(String.prototype, {
	lazySplit: {
		enumerable: false,
		writable: false,
		configurable: false,
		value: function (this: string, delim: string | RegExp, amount?: number): string[] {
			if (typeof amount !== 'number') amount = 1;
			const out: string[] = [];
			let input = this.toString();
			if (delim instanceof RegExp) delim = new RegExp(delim, delim.flags.replace('g', ''));
			for (let i = 0; i < amount; i++) {
				if (delim instanceof RegExp) {
					const match = input.match(delim);
					if (!match) return [...out, input];
					const m = match[0];
					out.push(input.slice(0, match.index));
					input = input.slice(match.index + m.length);
					for (let j = 1; j < match.length; j++) out.push(match[j]);
				} else {
					const match = input.indexOf(delim);
					if (match < 0) return [...out, input];
					out.push(input.slice(0, match));
					input = input.slice(match + delim.length);
				}
			}
			out.push(input);
			return out;
		},
	},
	gsub: {
		enumerable: false,
		writable: false,
		configurable: false,
		value: function (this: string, match: RegExp, replace: string | ((arg: string) => string)): string {
			// let latestMatch: RegExpExecArray;
			// do {
			// 	latestMatch = match.exec()
			// } while (latestMatch);
			// TODO
			return 'FIXME';
		},
	},
});
