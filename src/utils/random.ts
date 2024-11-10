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

function sample(input: null, rng?: RNGSource): number;
function sample(input: number, rng?: RNGSource): number;
function sample(input: [number, number], rng?: RNGSource): number;
function sample(input: Record<string, number>, rng?: RNGSource): string;
function sample(input: null | number | [number, number] | Record<string, number>, rng?: RNGSource): number | string {
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
	log(`Called sample() with input`, input);
	return RNG();
}

export { sample };
