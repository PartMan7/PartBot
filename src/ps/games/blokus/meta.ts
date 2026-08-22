import { GamesList } from '@/ps/games/types';
import { fromHumanTime } from '@/utils/humanTime';

import type { Meta } from '@/ps/games/types';

export const meta: Meta = {
	name: 'Blokus',
	id: GamesList.Blokus,
	aliases: ['blk'],
	abbr: 'Blokus',

	players: 'many',
	minSize: 2,
	maxSize: 4,

	autostart: false,
	pokeTimer: fromHumanTime('2 min'),
	timer: fromHumanTime('3 min'),

	htp: {
		goal: 'Place all your pieces on the board, or have the fewest blocks left when no one can play.',
		sections: [
			{
				title: 'Placement',
				lines: [
					'- Each player starts from their corner with their first piece.',
					'- Later pieces must touch your own pieces only at corners (diagonally), never along edges.',
					'- You may be edge-adjacent to opponents\' pieces.',
					'- Pieces cannot overlap or leave the board.',
				],
			},
			{
				title: 'Turns',
				lines: [
					'- Select a piece, pick an orientation, then click the board to place it.',
					'- The starred cell is the anchor — click where that cell should go.',
					'- If you cannot play, your turn is skipped.',
				],
			},
			{
				title: 'Winning',
				lines: [
					'- Place every piece to win immediately.',
					'- If no one can play, whoever has the fewest blocks left in hand wins.',
				],
			},
		],
	},
	// UGO-CODE
	ugo: {
		cap: 10,
		points: {
			win: 4,
			loss: 2,
		},
	},
};
