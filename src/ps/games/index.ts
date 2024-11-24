import { GamesList } from '@/ps/games/common';
import { Othello, meta as OthelloMeta } from '@/ps/games/othello';

export const Games = {
	[GamesList.Othello]: {
		meta: OthelloMeta,
		instance: Othello,
	},
};
export type Games = typeof Games;
