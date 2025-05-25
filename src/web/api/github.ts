import crypto from 'crypto';

import { log } from '@/utils/logger';
import { WebError } from '@/utils/webError';

import type { RequestHandler } from 'express';

export const verb = 'post';

export const handler: RequestHandler = async (req, _res) => {
	const { payload } = req.body as { payload: string };
	const signature = req.header('X-Hub-Signature-256');
	log({ req, body: req.body, payload, signature });
	if (!signature) throw new WebError('Signature not provided.');
	const SHA256 = crypto.createHash('sha256').update(req.body).digest('hex');
	if (signature !== SHA256) throw new WebError('Signature invalid.');
	throw new WebError('Not added yet');
};
