import { Router } from 'express';

import { fsPath } from '@/utils/fsPath';
import { errorHandler } from '@/web/loaders/errors';
import { readFileStructure } from '@/web/loaders/util';

import type { APIRoute } from '@/types/web';
import type { Application } from 'express';

export default async function init(app: Application): Promise<void> {
	const router = Router();

	const routes = await readFileStructure(fsPath('web', 'api'));
	await Promise.all(
		Object.entries(routes).map(async ([urlPath, filepath]) => {
			const route: APIRoute = await import(filepath);
			router[route.verb ?? 'get'](urlPath, route.handler);
		})
	);

	app.use('/api', router);
	app.use('/api', errorHandler);
}
