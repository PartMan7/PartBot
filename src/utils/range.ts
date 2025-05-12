export function range(from: number, to: number, count: number): number[] {
	const offset = (to - from) / (count - 1);
	return Array.from({ length: count }, (_, index) => from + offset * index);
}
