import { GamesList } from '@/ps/games/common';
import { fromHumanTime } from '@/tools';

import type { Meta } from '@/ps/games/common';

export const meta: Meta = {
	name: 'Scrabble',
	id: GamesList.Scrabble,
	aliases: ['scrab'],
	players: 'many',

	minSize: 2,
	maxSize: 4,

	autostart: false,
	pokeTimer: fromHumanTime('1 min'),
	timer: fromHumanTime('2 min'),
};
