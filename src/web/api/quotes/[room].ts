import { getAllQuotes } from '@/database/quotes';

import type { RequestHandler } from 'express';

export const handler: RequestHandler = async (req, res) => {
	const { room } = req.params as { room: string };
	const quotes = await getAllQuotes(room);
	if (!quotes.length) {
		// https://github.com/microsoft/TypeScript/issues/12871
		res.sendStatus(404);
		return;
	}
	res.json(quotes);
};
