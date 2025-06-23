import { getGameById } from '@/database/games';
import { IS_ENABLED } from '@/enabled';
import { WebError } from '@/utils/webError';

import type { RequestHandler } from 'express';

export const handler: RequestHandler = async (req, res) => {
	if (!IS_ENABLED.DB) throw new Error('Database is disabled.');
	const { gameId } = req.params as { gameId: string };
	try {
		const game = await getGameById('othello', gameId);
		res.json(game!.toJSON());
	} catch (err: unknown) {
		if (err instanceof Error) throw new WebError(err.message, 404);
	}
};
