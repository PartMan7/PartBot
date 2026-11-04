import { getAllQuotes } from '@/database/quotes';
import { hydrateQuote } from '@/ps/commands/quotes';
import { WebError } from '@/utils/webError';

import type { APIRoute } from '@/types/web';
import type { RequestHandler } from 'express';

export const headers = [['Access-Control-Allow-Origin', '*']] satisfies APIRoute['headers'];

export const handler: RequestHandler = async (req, res) => {
	const { room } = req.params as { room: string };
	const quotes = await getAllQuotes(room);
	if (!quotes.length) throw new WebError(404);
	const indexed = quotes.map((quote, i) => ({ ...quote, index: i + 1 }));
	const last = Number(req.query.last);
	const choices = indexed.filter(({ index }) => index !== last);
	res.json(hydrateQuote((choices.length ? choices : indexed).random()));
};
