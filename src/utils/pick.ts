export function pick<T extends object>(base: T, ..._keys: (keyof T | (keyof T)[])[]): Partial<T> {
	const keys = _keys.flat(2) as (keyof T)[];
	const picked = {} as T;

	keys.forEach(key => {
		if (key in base) picked[key] = base[key];
	});

	return picked;
}
