import fs from 'fs';
import path from 'path';

const reactDir = path.join(import.meta.dir, 'react');
const pagesDir = path.join(reactDir, 'pages');
const outdir = path.join(reactDir, 'compiled');

const entrypoints = fs
	.readdirSync(pagesDir, { withFileTypes: true })
	.filter(entry => entry.isFile())
	.map(entry => path.join(pagesDir, entry.name));

import type { BunPlugin } from 'bun';

const reactGlobalPlugin: BunPlugin = {
	name: 'react-globals',
	setup(build) {
		const external = (globalName: string) => ({
			contents: `module.exports = window.${globalName};`,
			loader: 'js' as const,
		});
		build.onResolve({ filter: /^@\// }, args => ({
			path: path.join(import.meta.dir, '..', args.path.slice(2)),
		}));
		build.onResolve({ filter: /^react$/ }, () => ({ path: 'react', namespace: 'react-global' }));
		build.onLoad({ filter: /.*/, namespace: 'react-global' }, () => external('React'));
		build.onResolve({ filter: /^react-dom$/ }, () => ({ path: 'react-dom', namespace: 'react-dom-global' }));
		build.onLoad({ filter: /.*/, namespace: 'react-dom-global' }, () => external('ReactDOM'));
	},
};

const result = await Bun.build({
	entrypoints,
	outdir,
	root: pagesDir,
	format: 'iife',
	target: 'browser',
	minify: true,
	define: { 'process.env.NODE_ENV': '"production"' },
	plugins: [reactGlobalPlugin],
	tsconfig: path.join(reactDir, 'tsconfig.json'),
	naming: '[name].js',
});

if (!result.success) {
	for (const log of result.logs) process.stderr.write(`${log}\n`);
	process.exit(1);
}
