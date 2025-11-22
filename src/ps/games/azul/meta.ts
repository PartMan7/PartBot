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

	autostart: false,
	pokeTimer: fromHumanTime('30 sec'),
	timer: fromHumanTime('45 sec'),

	// UGO-CODE
	ugo: {
		cap: 12,
		points: {
			win: 3,
			loss: 2,
		},
	},
};
