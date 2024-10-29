import { Router, Application } from 'express';
import { readFileStructure } from '@/web/loaders/util';
import type { Route } from '@/types/web';

export default async function init(app: Application): Promise<void> {
	const router = Router();

	const routes = await readFileStructure(fsPath('web', 'api'));
	await Promise.all(
		Object.entries(routes).map(async ([urlPath, filepath]) => {
			const route: Route = await import(filepath);
			router[route.verb ?? 'get'](urlPath, route.handler);
		})
	);

	app.use('/api', router);
}
