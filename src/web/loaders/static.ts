import { type Application, static as expressStatic } from 'express';

import { fsPath } from '@/utils/fsPath';

export default async function init(app: Application): Promise<void> {
	app.get('/styles.css', (req, res) => res.sendFile(fsPath('web', 'react', 'compiled', 'styles.css')));
	app.get('/favicon.ico', (req, res) => res.sendFile(fsPath('web', 'static', 'favicon.ico')));
	app.use('/static', expressStatic(fsPath('web', 'static')));
}
