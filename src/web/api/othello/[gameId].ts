import { getGameById } from '@/database/games';

import type { RequestHandler } from 'express';

export const handler: RequestHandler = async (req, res) => {
	const { gameId } = req.params as { gameId: string };
	try {
		const game = await getGameById('othello', gameId);
		res.json(game.toJSON());
	} catch (err: unknown) {
		res.status(404).send((err as Error).message);
	}
};
