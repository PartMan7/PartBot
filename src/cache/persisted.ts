import { FlatCache } from 'flat-cache';

type CacheTypes = {
	gameId: number;
};

const defaults: CacheTypes = {
	gameId: 36 ** 3,
};

export type Cache<T> = {
	get(): T;
	set(arg: T): void;
};

export function useCache<T extends keyof CacheTypes>(cacheId: T): Cache<CacheTypes[T]> {
	const flatCache = new FlatCache();
	flatCache.load(cacheId);

	const get = (): CacheTypes[T] => {
		const stored = flatCache.get<CacheTypes[T]>('value');
		if (typeof stored === 'undefined') {
			flatCache.set('value', defaults[cacheId]);
			return defaults[cacheId];
		} else return stored;
	};
	const set = (value: CacheTypes[T]): void => {
		flatCache.set('value', value);
	};

	return { get, set };
}
