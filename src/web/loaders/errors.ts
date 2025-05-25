import { log } from '@/utils/logger';
import { WebError } from '@/utils/webError';

import type { NextFunction, Request, Response } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
	if (!(err instanceof WebError)) log(req, err);
	res
		// .header('content-type', 'application/text')
		.status('statusCode' in err && typeof err.statusCode === 'number' ? err.statusCode : 501)
		.send(err.message ?? 'An internal server error occurred!');
}
