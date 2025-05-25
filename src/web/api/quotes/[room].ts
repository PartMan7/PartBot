import { getAllQuotes } from '@/database/quotes';
import { WebError } from '@/utils/webError';

import type { RequestHandler } from 'express';

export const handler: RequestHandler = async (req, res) => {
	const { room } = req.params as { room: string };
	const quotes = await getAllQuotes(room);
	if (!quotes.length) throw new WebError(404);
	res.json(quotes);
};
