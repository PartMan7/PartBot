import * as cache from '@/cache';

type CacheKeys = (keyof typeof cache)[];

export function resetCache(...keys: CacheKeys) {
	(keys.length ? keys : (Object.keys(cache) as CacheKeys)).forEach(cacheKey => {
		// eslint-disable-next-line import/namespace -- cache key checked with the CacheKeys type
		const cachedValue = cache[cacheKey];
		Object.keys(cachedValue).forEach(key => delete cachedValue[key as keyof typeof cachedValue]);
	});
}
