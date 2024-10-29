import { Router, Application } from 'express';
import { readFileStructure } from '@/web/loaders/util';

import { renderReact } from '@/web/loaders/middleware';

import type { UIRoute } from '@/types/web';

export default async function init(app: Application): Promise<void> {
	const router = Router();

	router.use(renderReact);

	const routes = await readFileStructure(fsPath('web', 'ui'));
	await Promise.all(
		Object.entries(routes).map(async ([urlPath, filepath]) => {
			const route: UIRoute = await import(filepath);
			router.get(urlPath, route.handler);
		})
	);

	app.use(router);
}
