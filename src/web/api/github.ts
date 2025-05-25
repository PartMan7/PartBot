import crypto from 'crypto';

import { log } from '@/utils/logger';
import { WebError } from '@/utils/webError';

import type { RequestHandler } from 'express';

export const verb = 'post';

function gitHubHash(body: unknown): string {
	return crypto
		.createHmac('sha256', process.env.WEB_GITHUB_SECRET ?? 'No key provided.')
		.update(JSON.stringify(body))
		.digest('hex');
}

export const handler: RequestHandler = async (req, _res) => {
	const signature = req.header('X-Hub-Signature-256');
	const checksum = gitHubHash(req.body);
	log({ req, body: req.body, checksum, signature });
	if (!signature) throw new WebError('Signature not provided.');
	if (signature !== checksum) throw new WebError('Signature invalid.');
	throw new WebError('Not added yet');
};
