export function omit<T extends Record<string, unknown>, K extends keyof T>(input: T, ...keys: K[]): Omit<T, K> {
	return Object.fromEntries(Object.entries(input).filter(([key]: [keyof T, unknown]) => !keys.includes(key as K))) as Omit<T, K>;
}
