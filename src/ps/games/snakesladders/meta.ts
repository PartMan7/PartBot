import { GamesList } from '@/ps/games/types';
import { fromHumanTime } from '@/utils/humanTime';

import type { Meta } from '@/ps/games/types';

export const meta: Meta = {
	name: 'Snakes & Ladders',
	id: GamesList.SnakesLadders,
	aliases: ['sl', 'snakesandladders', 'snakesnladders', 'snakes', 'snek'],
	abbr: 'Snakes',

	players: 'many',
	minSize: 2,
	maxSize: 4,

	autostart: false,
	pokeTimer: fromHumanTime('30 sec'),
	timer: fromHumanTime('45 sec'),

	htp: {
		goal: 'Be the first to reach 100 to win.',
		sections: [
			{
				title: 'Gameplay',
				lines: [
					'- Each player takes turns rolling a six-sided die to move their token along the board',
					'- Players move their token forward by the number of spaces indicated by the die roll',
					'- If a player lands on a snake, they move their token backward by the number of spaces indicated by the snake',
					'- If a player lands on a ladder, they move their token forward by the number of spaces indicated by the ladder',
				],
			},
		],
	},
	// UGO-CODE
	ugo: {
		cap: 12,
		points: {
			win: 3,
			loss: 2,
		},
	},
};
