import { emptyObject } from '@/utils/empty-object';

export function cacheBuster(_filepath: string): boolean {
	const filepath = _filepath.startsWith('/') ? _filepath : require.resolve(_filepath);
	if (!require.cache[filepath]) return false;
	emptyObject(require.cache[filepath].exports);
	emptyObject(require.cache[filepath]);
	delete require.cache[filepath];
	return true;
}
