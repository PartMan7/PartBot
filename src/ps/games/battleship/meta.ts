import { GamesList } from '@/ps/games/types';
import { fromHumanTime } from '@/utils/humanTime';

import type { Meta } from '@/ps/games/types';

export const meta: Meta = {
	name: 'Battleship',
	id: GamesList.Battleship,
	aliases: ['bs'],
	abbr: 'BS',
	players: 'many',

	turns: {
		A: 'A',
		B: 'B',
	},

	autostart: true,
	pokeTimer: fromHumanTime('30 sec'),
	timer: fromHumanTime('1 min'),

	htp: {
		goal: "Sink all of your opponent's ships before they sink yours!",
		sections: [
			{
				title: 'Setup',
				lines: [
					'- 5 ships each to be placed on a 10x10 grid.',
					'- They are: (C)arrier (5), (B)attleship (4), (D)estroyer (3), (S)ubmarine (3), and (P)atrol (2).',
					'- Ships can be placed horizontally or vertically, but not diagonally.',
					'- Ships cannot overlap or go out of bounds.',
				],
			},
			{
				title: 'Gameplay',
				lines: [
					"- Players take turns shooting at coordinates on their opponent's board.",
					'- If a ship is hit, it is marked as hit.',
					'- If all ships on one side are sunk, that player loses, and the game ends.',
				],
			},
		],
	},

	// UGO-CODE
	ugo: {
		cap: 12,
		points: {
			win: 5,
			loss: 2,
		},
	},
};
