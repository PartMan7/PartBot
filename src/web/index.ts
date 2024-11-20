import express from 'express';
import { port } from '@/config/web';

import loadAPI from '@/web/loaders/api';
import loadUI from '@/web/loaders/ui';

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

if (process.env.USE_WEB) {
	loadAPI(app).then(() => loadUI(app));
	app.listen(port, () => log(`Web is running!`));
}

export default app;
