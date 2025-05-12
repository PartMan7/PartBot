import { sample, useRNG } from '@/utils/random';

import type { TranslationFn } from '@/i18n/types';
import type { RNGSource } from '@/utils/random';

declare global {
	interface Array<T> {
		random(rng?: RNGSource): T;
		sample(amount: number, rng?: RNGSource): T[];
		remove(...toRemove: T[]): T[];
		shuffle(rng?: RNGSource): T[];
		filterMap<X>(cb: (element: T, index: number, thisArray: T[]) => X | undefined): X | undefined;
		unique(): T[];
		list($T?: TranslationFn | string): string;
		space<S = unknown>(spacer: S): (T | S)[];
		count(): Record<T & (string | number), number>;
		count(map: true): Map<T, number>;
	}
	interface ReadonlyArray<T> {
		random(rng?: RNGSource): T;
		sample(amount: number, rng?: RNGSource): T[];
		filterMap<X>(cb: (element: T, index: number, thisArray: T[]) => X | undefined): X | undefined;
		unique(): T[];
		list($T?: TranslationFn): string;
		space<S = unknown>(spacer: S): (T | S)[];
		count(): Record<T & (string | number), number>;
		count(map: true): Map<T, number>;
	}

	interface String {
		lazySplit(match: string | RegExp, cases: number): string[];
		gsub(match: RegExp, replace: string | ((arg: string, ...captures: string[]) => string)): string;
	}

	interface Number {
		toLetter(): string;
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
			const output: T[] = [];
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
	list: {
		enumerable: false,
		writable: false,
		configurable: false,
		value: function <T extends string | number>(this: T[], $T?: TranslationFn | string): string {
			const conjunction = typeof $T === 'string' ? $T : ($T?.('GRAMMAR.AND') ?? 'and');
			if (this.length === 0) return '';
			if (this.length === 1) return this.toString();
			if (this.length === 2) return this.map(term => term.toString()).join(` ${conjunction} `);
			return `${this.slice(0, -1)
				.map(term => term.toString())
				.join(', ')}, ${conjunction} ${this.at(-1)!.toString()}`;
		},
	},
	space: {
		enumerable: false,
		writable: false,
		configurable: false,
		value: function <T = unknown, S = unknown>(this: T[], spacer: S): (T | S)[] {
			if (this.length === 0 || this.length === 1) return this;
			return this.slice(1).reduce<(T | S)[]>(
				(acc, term) => {
					acc.push(spacer, term);
					return acc;
				},
				[this[0]]
			);
		},
	},
	count: {
		enumerable: false,
		writable: false,
		configurable: false,
		value: function <T extends string | number | symbol = unknown & (string | number)>(
			this: T[],
			map?: boolean
		): Record<T & string, number> | Map<T, number> {
			if (map) {
				return this.reduce<Map<T, number>>((out, term) => {
					if (!out.has(term)) out.set(term, 1);
					else out.set(term, out.get(term)! + 1);
					return out;
				}, new Map());
			}
			return (this as string[]).reduce<Record<string, number>>((out, term) => {
				out[term] ??= 0;
				out[term]++;
				return out;
			}, {});
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
					input = input.slice(match.index! + m.length);
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
		value: function (this: string, match: RegExp, replacer: string | ((substring: string, ...args: string[]) => string)): string {
			let output = this.toString();
			while (true) {
				// TypeScript what the heck
				const next = typeof replacer === 'string' ? output.replace(match, replacer) : output.replace(match, replacer);
				if (next === output) break;
				output = next;
			}
			return output;
		},
	},
});

Object.defineProperties(Number.prototype, {
	toLetter: {
		enumerable: false,
		writable: false,
		configurable: false,
		value: function (this: number) {
			const aCode = 'A'.charCodeAt(0);
			return String.fromCharCode(aCode + this - 1);
		},
	},
});
