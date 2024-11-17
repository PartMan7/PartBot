import { emptyObject } from '@/utils/emptyObject';

export function cachebuster(_filepath: string): boolean {
	const filepath = _filepath.startsWith('/') ? _filepath : require.resolve(_filepath);
	const cache = require.cache[filepath];
	if (!cache) return false;
	emptyObject(cache.exports);
	emptyObject(cache);
	delete require.cache[filepath];
	return true;
}
