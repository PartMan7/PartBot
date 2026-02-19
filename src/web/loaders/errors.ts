import { escapeHTML } from 'ps-client/tools';

import { Logger } from '@/utils/logger';
import { WebError } from '@/utils/webError';

import type { Application, NextFunction, Request, Response } from 'express';

function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
	if (!(err instanceof WebError)) Logger.log(`[${req.method}] ${req.url}`, err);
	const message = escapeHTML(err.message ?? 'An internal server error occurred!');
	res
		.status('statusCode' in err && typeof err.statusCode === 'number' ? err.statusCode : 501)
		.send(
			`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${message}</title></head><body><pre>${message}</pre></body></html>`
		);
}

export default function init(app: Application): void {
	app.use(errorHandler);
}
