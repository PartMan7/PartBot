import { RecursiveArray } from '@/types/common';

export function pick<T extends { [key: string]: unknown }>(base: T, ..._keys: RecursiveArray<string>): T {
	// @ts-expect-error -- I don't think we'll ever put this deep enough to matter
	const keys: (keyof T)[] = _keys.flat(Infinity);
	const picked = {} as T;

	keys.forEach(key => {
		if (key in base) picked[key] = base[key];
	});

	return picked;
}
