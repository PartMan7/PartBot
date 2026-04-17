import { CHESS_THEMES, defaultTheme } from '@/ps/games/chess/themes';
import { GamesList } from '@/ps/games/types';
import { fromHumanTime } from '@/utils/humanTime';

import type { Meta } from '@/ps/games/types';

export const meta: Meta = {
	name: 'Chess',
	id: GamesList.Chess,
	aliases: ['mengyisacapitalist', 'shatranj'],
	players: 'many',

	turns: {
		W: 'White',
		B: 'Black',
	},

	autostart: true,
	canOfferDraws: true,
	pokeTimer: fromHumanTime('3 min'),
	timer: fromHumanTime('5 min'),

	themes: CHESS_THEMES,
	defaultTheme,

	// UGO-CODE
	ugo: {
		cap: 12,
		points: {
			win: 14,
			draw: 11,
			loss: 8,
		},
	},
};
