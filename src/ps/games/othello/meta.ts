import { GamesList } from '@/ps/games/types';
import { fromHumanTime } from '@/utils/humanTime';

import type { Meta } from '@/ps/games/types';

export const meta: Meta = {
	name: 'Othello',
	id: GamesList.Othello,
	aliases: ['otgoodbye'],
	players: 'many',

	turns: {
		B: 'Black',
		W: 'White',
	},

	autostart: true,
	pokeTimer: fromHumanTime('30 sec'),
	timer: fromHumanTime('1 min'),

	htp: {
		goal: 'Have more discs of your color than your opponent when the game ends.',
		sections: [
			{
				title: 'Initial board setup',
				lines: ['- 2 white and 2 black discs start in the center.'],
				images: [{ path: 'othello/setup.png', alt: 'Initial Othello board setup', width: 170, height: 178 }],
			},
			{
				title: 'Gameplay',
				lines: [
					'- Black moves first, then white.',
					'- A valid move must outflank at least one opponent disc vertically, horizontally, or diagonally.',
					'- Outflank: your disc borders opponent row(s) at both ends.',
					'- If you have no valid move, your turn is skipped.',
					'- Game ends when neither player can move or the board is full.',
				],
			},
			{
				title: 'Valid move example',
				lines: ['- Black outflanks White vertically, horizontally, and diagonally (not all three required).'],
				images: [{ path: 'othello/valid-move.gif', alt: 'Valid Othello move example', width: 170 }],
			},
			{
				title: 'Win conditions',
				lines: ['- Most discs wins.'],
			},
		],
	},
	// UGO-CODE
	ugo: {
		cap: 12,
		points: {
			win: 10,
			draw: 7,
			loss: 6,
		},
	},
};
