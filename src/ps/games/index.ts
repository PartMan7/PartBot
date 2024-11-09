import { Othello } from '@/ps/games/othello';
import { GamesList } from '@/ps/games/common';

export const Games = {
	[GamesList.Othello]: Othello,
};
export type Games = typeof Games;
