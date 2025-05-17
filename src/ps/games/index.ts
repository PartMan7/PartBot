import { GamesList, type Meta } from '@/ps/games/common';
import { ConnectFour, meta as ConnectFourMeta } from '@/ps/games/connectfour';
import { Mastermind, meta as MastermindMeta } from '@/ps/games/mastermind';
import { Othello, meta as OthelloMeta } from '@/ps/games/othello';
import { Scrabble, meta as ScrabbleMeta } from '@/ps/games/scrabble';

export const Games = {
	[GamesList.Othello]: {
		meta: OthelloMeta,
		instance: Othello,
	},
	[GamesList.Mastermind]: {
		meta: MastermindMeta,
		instance: Mastermind,
	},
	[GamesList.ConnectFour]: {
		meta: ConnectFourMeta,
		instance: ConnectFour,
	},
	[GamesList.Scrabble]: {
		meta: ScrabbleMeta,
		instance: Scrabble,
	},
} satisfies Readonly<Record<GamesList, Readonly<{ meta: Meta; instance: unknown }>>>;
export type Games = typeof Games;
