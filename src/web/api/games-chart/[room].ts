import { getGamesChartData } from '@/database/games';
import { IS_ENABLED } from '@/enabled';

import type { RequestHandler } from 'express';

export const handler: RequestHandler = async (req, res) => {
	if (!IS_ENABLED.DB) throw new Error('Database is disabled.');
	const { room } = req.params as { room: string };
	res.json(await getGamesChartData(room));
};
