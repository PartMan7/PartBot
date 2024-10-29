import * as cache from '@/cache';

type CacheKeys = (keyof typeof cache)[];

export function resetCache(...keys: CacheKeys) {
	(keys.length ? keys : Object.keys(cache)).forEach(cacheKey => {
		const cachedValue = cache[cacheKey];
		Object.keys(cachedValue).forEach(key => delete cachedValue[key]);
	});
}
