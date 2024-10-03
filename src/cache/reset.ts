import * as cache from '@/cache';

type CacheKeys = (keyof typeof cache)[];

export default function reset (keys: CacheKeys = Object.keys(cache) as CacheKeys) {
	keys.forEach(cacheKey => {
		const cachedValue = cache[cacheKey];
		Object.keys(cachedValue).forEach(key => delete cachedValue[key]);
	});
}
