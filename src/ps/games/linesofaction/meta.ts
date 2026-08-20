import { GamesList } from '@/ps/games/types';
import { fromHumanTime } from '@/utils/humanTime';

import type { Meta } from '@/ps/games/types';

export const meta: Meta = {
	name: 'Lines of Action',
	id: GamesList.LinesOfAction,
	aliases: ['loa'],
	abbr: 'LoA',
	players: 'many',

	turns: {
		B: 'Black',
		W: 'White',
	},

	autostart: true,
	pokeTimer: fromHumanTime('30 sec'),
	timer: fromHumanTime('1 min'),

	htp: {
		goal: 'Connect all of your pieces into one group. Pieces connect orthogonally or diagonally.',
		sections: [
			{
				title: 'Setup',
				lines: [
					'- Black has 12 pieces on the top and bottom rows (not in the corners).',
					'- White has 12 pieces on the left and right columns (not in the corners).',
					'- Black moves first.',
				],
			},
			{
				title: 'Movement',
				lines: [
					'- On your turn, move one of your pieces in a straight line (horizontal, vertical, or diagonal).',
					'- Move exactly as many squares as there are pieces of either color on that entire line.',
					"- You may jump over your own pieces, but not over your opponent's.",
					'- You may not land on your own piece.',
					'- You may capture an opponent piece by landing on it.',
				],
			},
			{
				title: 'Other rules',
				lines: [
					'- If you have no legal move, your turn is skipped.',
					'- A single piece counts as a connected group.',
					'- If a move connects both players, the player who moved wins.',
				],
			},
		],
	},
	ugo: {
		cap: 12,
		points: {
			win: 10,
			draw: 7,
			loss: 6,
		},
	},
};
