import { Router } from 'express';

import { fsPath } from '@/utils/fsPath';
import { readFileStructure } from '@/web/loaders/util';

import type { Application } from 'express';

export default async function init(app: Application): Promise<void> {
	const router = Router();

	const routes = await readFileStructure(fsPath('web', 'react', 'pages'));
	await Promise.all(
		Object.entries(routes).map(async ([urlPath, filePath]) => {
			router.get(urlPath, (req, res) => res.sendFile(filePath.replace('/pages/', '/compiled/').replace(/(?:\.tsx?)?$/, '.js')));
		})
	);

	app.use('/bundles', router);
}
