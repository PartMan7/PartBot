export type RNGSource = null | undefined | number | (() => number);

function PRNG(seed: number): () => number {
	// Mulberry32
	// Shoutouts:
	// https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32
	// https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
	let s = seed;
	return function () {
		s |= 0;
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
const JSRNG = (): number => Math.random();

export function useRNG(rng?: RNGSource): () => number {
	if (typeof rng === 'function') return rng;
	if (typeof rng === 'number') return PRNG(rng);
	return JSRNG;
}

type Percent = `${number}%`;
function sample(input: null, rng?: RNGSource): number;
function sample(input: number, rng?: RNGSource): number;
function sample(input: [number, number], rng?: RNGSource): number;
function sample(input: Record<string, number>, rng?: RNGSource): string;
function sample(input: Percent, rng?: RNGSource): boolean;
function sample(
	input: null | number | [number, number] | Record<string, number> | Percent,
	rng?: RNGSource
): number | string | boolean {
	const RNG = useRNG(rng);
	if (!input) return RNG();
	if (typeof input === 'number') return Math.floor(input * RNG());
	if (Array.isArray(input)) return input[0] + Math.floor((input[1] - input[0]) * RNG());
	if (typeof input === 'object') {
		const thresholds = Object.entries(input).reduce<[string, number][]>((acc, [key, weight]) => {
			const lastWeight = acc.length ? acc.at(-1)![1] : 0;
			return [...acc, [key, lastWeight + weight]];
		}, []);
		if (!thresholds.length) throw new Error('Called RNG on record set with no keys');
		const totalWeight = thresholds.at(-1)![1];
		if (totalWeight <= 0) throw new Error('Called RNG on record set with invalid weights');
		const lookup = totalWeight * RNG();
		return thresholds.find(([, weight]) => lookup < weight)![0];
	}
	if (typeof input === 'string' && input.endsWith('%')) {
		const percentage = parseFloat(input.slice(0, -1));
		if (isNaN(percentage)) throw new Error(`Invalid percentage ${input}`);
		return RNG() * 100 < percentage;
	}
	return RNG();
}

export { sample };

export function randomString(length = 16, rng?: RNGSource): string {
	const RNG = useRNG(rng);
	const validChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
	return Array.from({ length }, () => validChars.random(RNG)).join('');
}

/**
 * @see https://stackoverflow.com/a/47593316
 */
export function cyrb128(str: string): [number, number, number, number] {
	let h1 = 1779033703,
		h2 = 3144134277,
		h3 = 1013904242,
		h4 = 2773480762;
	for (let i = 0, k; i < str.length; i++) {
		k = str.charCodeAt(i);
		h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
		h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
		h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
		h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
	}
	h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
	h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
	h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
	h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
	h1 ^= h2 ^ h3 ^ h4;
	h2 ^= h1;
	h3 ^= h1;
	h4 ^= h1;
	return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}
