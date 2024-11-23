export function pick<T extends { [key: string | symbol]: unknown }>(base: T, ..._keys: (keyof T | (keyof T)[])[]): Partial<T> {
	const keys: (keyof T)[] = _keys.flat(2);
	const picked = {} as T;

	keys.forEach(key => {
		if (key in base) picked[key] = base[key];
	});

	return picked;
}
