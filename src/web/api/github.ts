import crypto from 'crypto';

import { hotpatch } from '@/sentinel/hotpatch';
import { WebError } from '@/utils/webError';

import type { RequestHandler } from 'express';

export const verb = 'post';

function gitHubHash(body: string): string {
	const hash = crypto
		.createHmac('sha256', process.env.WEB_GITHUB_SECRET ?? 'No key provided.')
		.update(body)
		.digest('hex');
	return `sha256=${hash}`;
}

export const handler: RequestHandler = async (req, res) => {
	const signature = req.header('X-Hub-Signature-256');
	const checksum = gitHubHash(JSON.stringify(req.body));
	if (!signature) throw new WebError('Signature not provided.');
	// Not going to bother with protecting against timing attacks
	// TODO: Maybe use crypto.timingSafeEqual? Honestly just looks way too cluttered
	if (signature !== checksum) throw new WebError('Signature invalid.');

	await hotpatch('code', Symbol.for('GitHub'));
	res.send('Code updated.');
};
