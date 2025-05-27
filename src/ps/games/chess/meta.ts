import { CHESS_THEMES, defaultTheme } from '@/ps/games/chess/themes';
import { GamesList } from '@/ps/games/common';
import { fromHumanTime } from '@/tools';

import type { Meta } from '@/ps/games/common';

export const meta: Meta = {
	name: 'Chess',
	id: GamesList.Chess,
	aliases: ['mengyisacapitalist'],
	players: 'many',

	turns: {
		W: 'White',
		B: 'Black',
	},

	autostart: true,
	pokeTimer: fromHumanTime('30 sec'),
	timer: fromHumanTime('1 min'),

	themes: CHESS_THEMES,
	defaultTheme,
};
