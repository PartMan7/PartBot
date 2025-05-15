import { GamesList } from '@/ps/games/common';
import { fromHumanTime } from '@/tools';

import type { Meta } from '@/ps/games/common';

export const meta: Meta = {
	name: 'Connect Four',
	id: GamesList.ConnectFour,
	aliases: ['c4'],
	players: 'many',

	turns: {
		Y: 'Yellow',
		R: 'Red',
	},

	autostart: true,
	pokeTimer: fromHumanTime('30 sec'),
	timer: fromHumanTime('1 min'),
};
