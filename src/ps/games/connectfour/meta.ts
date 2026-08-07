import { GamesList } from '@/ps/games/types';
import { fromHumanTime } from '@/utils/humanTime';

import type { Meta } from '@/ps/games/types';

export const meta: Meta = {
	name: 'Connect Four',
	id: GamesList.ConnectFour,
	aliases: ['c4'],
	abbr: 'C4',
	players: 'many',

	turns: {
		Y: 'Yellow',
		R: 'Red',
	},

	autostart: true,
	pokeTimer: fromHumanTime('30 sec'),
	timer: fromHumanTime('1 min'),

	htp: {
		goal: 'Get four of their colored discs in a row—horizontally, vertically, or diagonally.',
		sections: [
			{
				title: 'Gameplay',
				lines: [
					'- Players take turns dropping one disc into one of the seven columns.',
					'- Discs stack on top of each other in the selected column.'
				],
			},
		],
	},
	// UGO-CODE
	ugo: {
		cap: 12,
		points: {
			win: 5,
			draw: 3,
			loss: 2,
		},
	},
};
