export function deepClone<T>(input: T): T {
	if (!input) return input;

	const clone = Array.isArray(input) ? ([] as T) : ({} as T);
	for (const key in input) {
		const value = input[key];
		clone[key] = typeof value === 'object' ? deepClone(value) : value;
	}

	return clone;
}
