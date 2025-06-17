import { ScrabbleMods } from '@/ps/games/scrabble/constants';
import { ScrabbleModData } from '@/ps/games/scrabble/mods';
import { GamesList } from '@/ps/games/types';
import { fromHumanTime } from '@/tools';

import type { Meta } from '@/ps/games/types';

export const meta: Meta = {
	name: 'Scrabble',
	id: GamesList.Scrabble,
	aliases: ['scrab'],
	players: 'many',

	minSize: 2,
	maxSize: 4,

	mods: {
		list: ScrabbleMods,
		data: ScrabbleModData,
	},

	autostart: false,
	pokeTimer: fromHumanTime('1 min'),
	timer: fromHumanTime('2 min'),
};
