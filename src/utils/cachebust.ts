import { promises as fs } from 'fs';
import path from 'path';

import { emptyObject } from '@/utils/emptyObject';

function resolveCacheKey(filepath: string): string | null {
	try {
		return require.resolve(filepath);
	} catch {
		return require.cache[filepath] ? filepath : null;
	}
}

export function cachebust(_filepath: string): boolean {
	const filepath = resolveCacheKey(_filepath);
	if (!filepath) return false;
	const cache = require.cache[filepath];
	if (!cache) return false;
	if (!filepath.endsWith('.json') && cache.exports) emptyObject(cache.exports);
	if (Array.isArray(cache.children)) cache.children.length = 0;
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
