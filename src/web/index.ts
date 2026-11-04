import express, { json, urlencoded } from 'express';

import { port } from '@/config/web';
import connection from '@/database';
import { IS_ENABLED } from '@/enabled';
import { Logger } from '@/utils/logger';
import loadAPI from '@/web/loaders/api';
import loadBundles from '@/web/loaders/bundles';
import loadErrorHandler from '@/web/loaders/errors';
import loadStatic from '@/web/loaders/static';
import loadUI from '@/web/loaders/ui';

import type { Server } from 'http';

const app = express();

app.use(urlencoded({ extended: true }));
app.use(json());
let server: Promise<Server> | null = null;

if (IS_ENABLED.WEB) {
	server = Promise.resolve(connection)
		.then(() => loadStatic(app))
		.then(() => loadAPI(app))
		.then(() => loadBundles(app))
		.then(() => loadUI(app))
		.then(() => loadErrorHandler(app))
		.then(() => app.listen(port, () => Logger.log(`Web is running!`)));
}

export default server;
