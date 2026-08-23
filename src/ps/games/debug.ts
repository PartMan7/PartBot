/* eslint-disable no-console -- This isn't part of the bot */
import 'dotenv/config';

import { watch } from 'chokidar';
import { promises as fs } from 'fs';
import { createServer } from 'livereload';
import path from 'path';

import { MAX_PAGE_HTML_LENGTH } from '@/ps/constants';
import { debounce } from '@/utils/debounce';
import { fsPath } from '@/utils/fsPath';

const debugDir = fsPath('..', 'scripts', 'debug-games');

async function baseRenderTemplates(): Promise<void> {
	const { test } = await import('@/ps/games/test');
	const html = await test();
	const pct = ((html.length / MAX_PAGE_HTML_LENGTH) * 100).toFixed(1);
	console.log(`HTML ${html.length} / ${MAX_PAGE_HTML_LENGTH} (${pct}%)${html.length > MAX_PAGE_HTML_LENGTH ? ' OVER LIMIT' : ''}`);
	console.log('Rendering templates!');
	fs.readdir(path.join(debugDir, 'templates'))
		.then(files => files.filter(file => file.endsWith('.html')))
		.then(templates =>
			Promise.all(
				templates.map(async templateName => {
					const template = await fs.readFile(path.join(debugDir, 'templates', templateName), 'utf8');
					const out = template
						.replace('{HTML}', html)
						.replaceAll('{HTML_LENGTH}', String(html.length))
						.replaceAll('{HTML_LIMIT}', String(MAX_PAGE_HTML_LENGTH));
					await fs.writeFile(path.join(debugDir, 'live', templateName), out);
				})
			)
		)
		.then(() => console.log('Rendered templates.'));
}

const renderTemplates = debounce(baseRenderTemplates, 100);

if (require.main === module) {
	const watcher = watch([path.join(debugDir, 'templates'), fsPath('ps', 'games')]);
	watcher.on('all', async () => {
		renderTemplates();
	});
	const server = createServer({ port: 8082 });
	server.watch(path.join(debugDir, 'live'));
}
