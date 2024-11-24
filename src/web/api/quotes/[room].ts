import { getAllQuotes } from '@/database/quotes';

import type { RouteHandler } from '@/types/web';

export const handler: RouteHandler = async (req, res) => {
	const { room } = req.params as { room: string };
	const quotes = await getAllQuotes(room);
	if (!quotes.length) return res.sendStatus(404);
	return res.json(quotes);
};
