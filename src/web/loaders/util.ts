import { promises as fs } from 'fs';
import path from 'path';

import { fsPath } from '@/utils/fsPath';

export async function readFileStructure(root: string): Promise<Record<string, string>> {
	const files = await fs.readdir(root, { recursive: true });
	const routes = files
		.filter(file => /\.tsx?$/.test(file))
		.reduce<Record<string, string>>((acc, file) => {
			const label = file
				.replace(/\.tsx?$/, '')
				.replace('/index', '')
				.replace(/\[(\w+)]/g, ':$1');
			acc[`/${label}`] = path.join(root, file);
			return acc;
		}, {});

	return Object.fromEntries(
		Object.entries(routes).sortBy(([urlPath]) => {
			const segments = urlPath.split('/').filter(Boolean);
			return [segments.filter(seg => seg.startsWith(':')).length, -segments.filter(seg => !seg.startsWith(':')).length];
		})
	);
}

export async function renderTemplate(path: string, variables: Record<string, string> = {}): Promise<string> {
	const baseTemplate = await fs.readFile(fsPath('web', 'templates', path), 'utf8');
	return Object.entries(variables).reduce(
		(template, [variable, value]) => template.replaceAll(`{{${variable}}}`, value),
		baseTemplate
	);
}
