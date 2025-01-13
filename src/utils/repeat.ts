export function repeat<T>(arg: T, times: number): T[] {
	return Array.from({ length: times }, () => arg);
}
