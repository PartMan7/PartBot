export function pick<T extends object, K extends keyof T>(base: T, ..._keys: (K | readonly K[])[]): Pick<T, K> {
	const keys = _keys.flat(2) as K[];
	const picked = {} as Pick<T, K>;

	keys.forEach(key => {
		if (key in base) picked[key] = base[key];
	});

	return picked;
}
