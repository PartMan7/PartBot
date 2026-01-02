export function deepClone<T>(input: T): T {
	if (!input) return input;

	const clone = Array.isArray(input) ? ([] as T) : ({} as T);
	for (const _key in input) {
		const key = _key as keyof T;
		const value = input[key];
		clone[key] = typeof value === 'object' ? deepClone(value) : value;
	}

	return clone;
}
