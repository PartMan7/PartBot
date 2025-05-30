import { promises as fs } from 'fs';
import path from 'path';

import { emptyObject } from '@/utils/emptyObject';

export function cachebust(_filepath: string): boolean {
	const filepath = _filepath.startsWith('/') ? _filepath : require.resolve(_filepath);
	const cache = require.cache[filepath];
	if (!cache) return false;
	emptyObject(cache.exports);
	cache.children.length = 0;
	emptyObject(cache);
	delete require.cache[filepath];
	return true;
}

export async function cachebustDir(_dir: string): Promise<boolean> {
	const entries = await fs.readdir(_dir, { withFileTypes: true, recursive: true });
	const files = entries.filter(entry => entry.isFile());
	if (files.length === 0) return false;

	files.forEach(file => {
		cachebust(path.join(file.parentPath, file.name));
	});
	return true;
}
