import { GamesList } from '@/ps/games/types';
import { fromHumanTime } from '@/tools';

import type { Meta } from '@/ps/games/types';

export const meta: Meta = {
	name: 'Battleship',
	id: GamesList.Battleship,
	aliases: ['bs'],
	players: 'many',

	turns: {
		A: 'A',
		B: 'B',
	},

	autostart: true,
	pokeTimer: fromHumanTime('30 sec'),
	timer: fromHumanTime('1 min'),
};
