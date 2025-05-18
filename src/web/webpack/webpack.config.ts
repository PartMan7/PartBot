import fs from 'fs';
import path from 'path';

import type Webpack from 'webpack';

const reactDir = path.join(__dirname, '..', 'react');
const pagesDir = path.join(reactDir, 'pages');

const config: Webpack.Configuration = {
	mode: 'production',
	entry: Object.fromEntries(
		fs
			.readdirSync(pagesDir, { recursive: true, encoding: 'utf8', withFileTypes: true })
			.filter(entry => !entry.isDirectory())
			.map(file => {
				const fullPath = path.join(file.parentPath, file.name);
				const relative = path.relative(pagesDir, fullPath);
				return [relative, { import: fullPath, filename: relative.replace(/\.tsx?$/, '.js') }];
			})
	),
	externals: {
		react: 'React',
		'react-dom': 'ReactDOM',
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: { loader: 'ts-loader', options: { transpileOnly: true } },
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
		alias: {
			'@/web/react/components': path.join(reactDir, 'components'),
		},
	},
	output: { path: path.join(reactDir, 'compiled') },
	stats: 'errors-only',
};

export default config;
