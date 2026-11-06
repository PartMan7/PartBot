import { getAllQuotes } from '@/database/quotes';
import { hydrateQuote } from '@/ps/commands/quotes';
import { WebError } from '@/utils/webError';

import type { APIRoute } from '@/types/web';
import type { RequestHandler } from 'express';

export const headers = [['Access-Control-Allow-Origin', '*']] satisfies APIRoute['headers'];

export const handler: RequestHandler = async (req, res) => {
	const { room, index } = req.params as { room: string; index: string };
	const quote = (await getAllQuotes(room))[Number(index) - 1];
	if (!quote) throw new WebError(404);
	res.json({ ...hydrateQuote(quote), index: Number(index) });
};
