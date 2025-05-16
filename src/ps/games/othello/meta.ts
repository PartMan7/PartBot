import { GamesList } from '@/ps/games/common';
import { fromHumanTime } from '@/tools';

import type { Meta } from '@/ps/games/common';

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
};
