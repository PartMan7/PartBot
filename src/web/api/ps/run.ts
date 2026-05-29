import PS from '@/ps';
import { WebError } from '@/utils/webError';

import type { RequestHandler } from 'express';

const ACCESS_TOKEN = process.env.WEB_PS_ACCESS_TOKEN;

export const verb = 'post';

export const handler: RequestHandler = async (req, res) => {
	const { room, text, accessToken } = req.body as { room?: string; text?: string; accessToken?: string };
	if (!room || !text || !accessToken) throw new WebError(400);
	if (!ACCESS_TOKEN) throw new WebError(500);
	if (accessToken !== ACCESS_TOKEN) throw new WebError(401);
	const roomObj = PS.getRoom(room);
	if (!roomObj) throw new WebError(404);
	roomObj.send(text);
	res.json({ success: true });
};
