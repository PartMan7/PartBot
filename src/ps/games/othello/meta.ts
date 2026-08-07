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
		goal: 'Place discs on the board to surround and flip your opponent\'s discs.',
		sections: [
			{
				title: 'Setup',
				lines: [
					'Game begins with 4 discs placed in the center of the board with the same colored disks on opposite corners of the 2x2 central area.',
				]
			},
			{
				title: 'Gameplay',
				lines: [
					'- Players take turns placing discs on the board.',
					'- A valid move must outflank at least one of your opponent\'s discs vertically, horizontally, or diagonally.',
					'- Outflank means to place a disc on the board so that your opponent\'s row (or rows) of disc(s) is bordered at each end by a disc of your colour. ',
					'- When a disc is placed, it flips all of the opponent\'s discs that are in a straight line with the new disc.',
					'- If a player does not have a valid move, then the turn passes to the other player.',
				]
			},
			{
				title: 'Win conditions',
				lines: [
					'- The game ends when no more valid moves can be made.',
					'- The player with the most discs at the end wins.',
				],
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
