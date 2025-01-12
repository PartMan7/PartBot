import { GamesList } from '@/ps/games/common';
import { Mastermind, meta as MastermindMeta } from '@/ps/games/mastermind';
import { Othello, meta as OthelloMeta } from '@/ps/games/othello';

export const Games = {
	[GamesList.Othello]: {
		meta: OthelloMeta,
		instance: Othello,
	},
	[GamesList.Mastermind]: {
		meta: MastermindMeta,
		instance: Mastermind,
	},
};
export type Games = typeof Games;
