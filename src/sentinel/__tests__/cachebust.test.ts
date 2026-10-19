import { afterEach, describe, expect, it } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';

import { cachebust, cachebustDir } from '@/utils/cachebust';

const tempDirs: string[] = [];

afterEach(async () => {
	await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

async function tempDir(): Promise<string> {
	const dir = await mkdtemp(path.join(tmpdir(), 'pb-cachebust-'));
	tempDirs.push(dir);
	return dir;
}

describe('cachebust on Bun', () => {
	it('reloads edited module via import after cachebust', async () => {
		const dir = await tempDir();
		const modPath = path.join(dir, 'mod.ts');
		await writeFile(modPath, 'export const v = 1;\n');
		const first = await import(modPath);
		expect(first.v).toBe(1);
		await writeFile(modPath, 'export const v = 2;\n');
		expect(cachebust(modPath)).toBe(true);
		const second = await import(modPath);
		expect(second.v).toBe(2);
		expect(first).not.toBe(second);
	});

	it('same importer can re-import after cachebust', async () => {
		const dir = await tempDir();
		const modPath = path.join(dir, 'mod.ts');
		await writeFile(modPath, 'export const v = 1;\n');
		const first = await import(modPath);
		expect(cachebust(modPath)).toBe(true);
		await writeFile(modPath, 'export const v = 2;\n');
		const second = await import(modPath);
		expect(second.v).toBe(2);
		expect(first).not.toBe(second);
	});

	it('leaves un-busted dependency instance shared', async () => {
		const dir = await tempDir();
		const depPath = path.join(dir, 'dep.ts');
		const modPath = path.join(dir, 'mod.ts');
		await writeFile(depPath, 'export const token = { n: 1 };\n');
		await writeFile(modPath, `import { token } from './dep.ts';\nexport const get = () => token;\n`);
		const first = await import(modPath);
		const tokenRef = first.get();
		expect(cachebust(modPath)).toBe(true);
		await writeFile(modPath, `import { token } from './dep.ts';\nexport const get = () => token;\nexport const tag = 2;\n`);
		const second = await import(modPath);
		expect(second.get()).toBe(tokenRef);
		expect(second.tag).toBe(2);
	});

	it('cachebustDir busts every file in a directory', async () => {
		const dir = await tempDir();
		const sub = path.join(dir, 'sub');
		await mkdir(sub, { recursive: true });
		await writeFile(path.join(sub, 'a.ts'), 'export const a = 1;\n');
		await writeFile(path.join(sub, 'b.ts'), 'export const b = 1;\n');
		const a1 = await import(path.join(sub, 'a.ts'));
		expect(a1.a).toBe(1);
		await writeFile(path.join(sub, 'a.ts'), 'export const a = 2;\n');
		expect(await cachebustDir(sub)).toBe(true);
		const a2 = await import(path.join(sub, 'a.ts'));
		expect(a2.a).toBe(2);
	});

	it('resolves @/ path aliases', async () => {
		const mod = await import('@/utils/emptyObject');
		expect(mod.emptyObject).toBeFunction();
		expect(cachebust('@/utils/emptyObject')).toBe(true);
		const mod2 = await import('@/utils/emptyObject');
		expect(mod2.emptyObject).toBeFunction();
	});

	it('does not grow require.cache across 100 bust-and-reload cycles', async () => {
		const dir = await tempDir();
		const modPath = path.join(dir, 'cycle.ts');
		await writeFile(modPath, 'export const v = 0;\n');
		await import(modPath);
		const keysBefore = Object.keys(require.cache).length;
		for (let i = 0; i < 100; i++) {
			await writeFile(modPath, `export const v = ${i};\n`);
			expect(cachebust(modPath)).toBe(true);
			const mod = await import(modPath);
			expect(mod.v).toBe(i);
		}
		expect(Object.keys(require.cache).length).toBe(keysBefore);
	}, 30_000);
});
