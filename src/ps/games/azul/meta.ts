import { AzulMods } from '@/ps/games/azul/constants';
import { AzulModData } from '@/ps/games/azul/mods';
import { GamesList } from '@/ps/games/types';
import { fromHumanTime } from '@/utils/humanTime';

import type { Meta } from '@/ps/games/types';

export const meta: Meta = {
	name: 'Azul',
	id: GamesList.Azul,
	aliases: ['az'],
	abbr: 'Azul',

	players: 'many',
	minSize: 2,
	maxSize: 4,

	mods: {
		list: AzulMods,
		data: AzulModData,
	},

	autostart: false,
	pokeTimer: fromHumanTime('30 sec'),
	timer: fromHumanTime('60 sec'),

	htp: {
		goal: 'Have the highest score when any player completes a wall row.',
		sections: [
			{
				title: 'Setup',
				lines: [
					'- The game is played over several rounds, each consisting of two phases: drafting tiles and then scoring walls.',
					'- Game begins with 4 tiles placed in each factory.',
				],
			},
			{
				title: 'Drafting Phase',
				lines: [''],
				subsections: [
					{
						title: 'Picking tiles',
						lines: [
							'- Choose a tile from a factory to take all tiles of the same type from it.',
							'- The remaining tiles from that factory are moved to the waste.',
							'- The first to pick from the waste must also take the waste marker, giving them a penalty but also the first turn in the next round.',
						],
					},
					{
						title: 'Placing tiles',
						lines: [
							'- You can only place the tiles in one of the rows on your player board.',
							'- You must place all tiles of the same color in a row.',
							'- Any overflow of tiles will be moved to the penalty line.',
						],
					},
				],
			},
			{
				title: 'Scoring',
				lines: [
					'- Happens when there are no tiles left in factories/waste.',
					'- For each filled row, place one tile on the wall in the corresponding row and type.',
					'- Each wall tile scores contiguous horizontal and vertical lines through it.',
					'- After the game, each filled row gives 2 points, every column 7, every type 10.',
					'- The game ends when a row is filled.',
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
