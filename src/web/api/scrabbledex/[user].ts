import { getScrabbleDex } from '@/database/games';
import { IS_ENABLED } from '@/enabled';
import { toId } from '@/utils/toId';

import type { RequestHandler } from 'express';

export const handler: RequestHandler = async (req, res) => {
	if (!IS_ENABLED.DB) throw new Error('Database is disabled.');
	const { user } = req.params as { user: string };
	const userId = toId(user);
	const allEntries = await getScrabbleDex();
	const results = allEntries!.filter(entry => entry.by === userId).unique();
	const grouped = results.map(res => res.pokemon.toUpperCase()).groupBy(mon => mon.length);
	res.json(grouped);
};
