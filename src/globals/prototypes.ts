import { sample, useRNG } from '@/utils/random';

import type { TranslationFn } from '@/i18n/types';
import type { ArrayAtom } from '@/types/common';
import type { RNGSource } from '@/utils/random';

declare global {
	interface Array<T> {
		access<V = ArrayAtom<T>>(pos: number[]): V;
		count(): Record<T & (string | number), number>;
		count(map: true): Map<T, number>;
		group(size: number): T[][];
		filterMap<X>(cb: (element: T, index: number, thisArray: T[]) => X | undefined): X[];
		list($T?: TranslationFn | string): string;
		random(rng?: RNGSource): T | null;
		remove(...toRemove: T[]): T[];
		sample(amount: number, rng?: RNGSource): T[];
		shuffle(rng?: RNGSource): T[];
		/** Default order is ascending */
		sortBy(getSort: ((term: T, thisArray: T[]) => unknown) | null, dir?: 'asc' | 'desc'): T[];
		space<S = unknown>(spacer: S): (T | S)[];
		sum(): T;
		unique(): T[];
	}
	interface ReadonlyArray<T> {
		access<V = ArrayAtom<T>>(pos: number[]): V;
		count(): Record<T & (string | number), number>;
		count(map: true): Map<T, number>;
		filterMap<X>(cb: (element: T, index: number, thisArray: T[]) => X | undefined): X[];
		group(size: number): T[][];
		list($T?: TranslationFn): string;
		random(rng?: RNGSource): T | null;
		sample(amount: number, rng?: RNGSource): T[];
		space<S = unknown>(spacer: S): (T | S)[];
		sum(): T;
		unique(): T[];
	}

	interface String {
		gsub(match: RegExp, replace: string | ((arg: string, ...captures: string[]) => string)): string;
		lazySplit(match: string | RegExp, cases: number): string[];
	}

	interface Number {
		toLetter(): string;
		times(callback: (i: number) => void): void;
	}
}

type Prototypes<M> = Record<string, (this: M, ...args: never[]) => unknown>;

type PotentiallyCustomValue = unknown & { __custom__?: boolean };
function define({ prototype: object }: { prototype: object }, methodName: string, value: unknown): boolean {
	if (!object) return false;
	if (methodName in object) {
		if (!(object as { [key: string]: PotentiallyCustomValue })[methodName].__custom__) return false;
	}
	(value as PotentiallyCustomValue).__custom__ = true;
	Object.defineProperty(object, methodName, { enumerable: false, writable: true, configurable: false, value });
	return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- calls that throw TypeErrors can't use unknown
const ARRAY_PROTOTYPES: Prototypes<Array<any>> = {
	access: function <T, V = ArrayAtom<T>>(this: T[], point: number[]): V {
		// eslint-disable-next-line -- Consumer-side responsibility for type safety
		return point.reduce<any>((arr, index) => arr[index], this);
	},
	count: function <T extends string | number | symbol = unknown & (string | number)>(
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
	filterMap: function <X, T = unknown>(this: T[], callback: (element: T, index: number, thisArray: T[]) => X | undefined): X[] {
		const results: X[] = [];
		for (let i = 0; i < this.length; i++) {
			const result = callback(this[i], i, this);
			if (result === undefined) continue;
			results.push(result);
		}
		return results;
	},
	group: function <T>(this: T[], size: number, evenly = false): T[][] {
		if (this.length <= size) return [this];
		if (!evenly) {
			const ret: T[][] = [];
			const length = Math.ceil(this.length / size);
			for (let i = 0; i < length; i++) {
				ret.push(this.slice(i * size, i * size + size));
			}
			return ret;
		}
		// TODO
		return [];
	},
	list: function <T extends string | number>(this: T[], $T?: TranslationFn | string): string {
		const conjunction = typeof $T === 'string' ? $T : ($T?.('GRAMMAR.AND') ?? 'and');
		if (this.length === 0) return '';
		if (this.length === 1) return this.toString();
		if (this.length === 2) return this.map(term => term.toString()).join(` ${conjunction} `);
		return `${this.slice(0, -1)
			.map(term => term.toString())
			.join(', ')}, ${conjunction} ${this.at(-1)!.toString()}`;
	},
	random: function <T = unknown>(this: T[], rng?: RNGSource): T | null {
		const lookup = sample(this.length, useRNG(rng));
		if (lookup >= this.length) return null;
		return this[lookup];
	},
	remove: function <T = unknown>(this: T[], ...terms: T[]): boolean {
		let out = true;
		terms.forEach(term => {
			if (this.indexOf(term) >= 0) this.splice(this.indexOf(term), 1);
			else out = false;
		});
		return out;
	},
	sample: function T<T>(this: T[], amount: number, rng?: RNGSource): T[] {
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
	shuffle: function <T>(this: T[], rng?: RNGSource): T[] {
		const RNG = useRNG(rng);
		for (let i = this.length - 1; i > 0; i--) {
			const j = Math.floor(RNG() * (i + 1));
			[this[i], this[j]] = [this[j], this[i]];
		}
		return Array.from(this);
	},
	sortBy: function <T, W = number>(this: T[], getSort: ((term: T, thisArray: T[]) => W) | null, dir?: 'asc' | 'desc'): T[] {
		const cache = this.reduce<Map<T, W>>((map, term) => {
			map.set(term, getSort ? getSort(term, this) : (term as unknown as W));
			return map;
		}, new Map());
		return this.sort((a, b) =>
			cache.get(a)! === cache.get(b)! ? 0 : (dir === 'desc' ? cache.get(a)! < cache.get(b)! : cache.get(b)! < cache.get(a)!) ? 1 : -1
		);
	},
	space: function <T, S>(this: T[], spacer: S): (T | S)[] {
		if (this.length === 0 || this.length === 1) return this;
		return this.slice(1).reduce<(T | S)[]>(
			(acc, term) => {
				acc.push(spacer, term);
				return acc;
			},
			[this[0]]
		);
	},
	sum: function (this: number[]): number {
		return this.reduce((sum, term) => sum + term, 0);
	},
	unique: function <T>(this: T[]): T[] {
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
};

const STRING_PROTOTYPES: Prototypes<string> = {
	gsub: function (this: string, match: RegExp, replacer: string | ((substring: string, ...args: string[]) => string)): string {
		let output = this.toString();
		while (true) {
			// TypeScript what the heck
			const next = typeof replacer === 'string' ? output.replace(match, replacer) : output.replace(match, replacer);
			if (next === output) break;
			output = next;
		}
		return output;
	},
	lazySplit: function (this: string, delim: string | RegExp, amount?: number): string[] {
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
};

const NUMBER_PROTOTYPES: Prototypes<number> = {
	toLetter: function (this: number): string {
		const aCode = 'A'.charCodeAt(0);
		return String.fromCharCode(aCode + this - 1);
	},
	times: function (this: number, callback: (i: number) => void): void {
		for (let i = 0; i < this; i++) callback(i);
	},
};

Object.entries(ARRAY_PROTOTYPES).forEach(([methodName, value]) => define(Array, methodName, value));
Object.entries(STRING_PROTOTYPES).forEach(([methodName, value]) => define(String, methodName, value));
Object.entries(NUMBER_PROTOTYPES).forEach(([methodName, value]) => define(Number, methodName, value));
