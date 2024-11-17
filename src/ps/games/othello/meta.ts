import { GamesList, Meta } from '@/ps/games/common';

export const meta: Meta = {
	name: 'Othello',
	id: GamesList.Othello,
	aliases: ['otgoodbye'],

	turns: {
		B: 'Black',
		W: 'White',
	},

	autostart: true,
	pokeTimer: Tools.fromHumanTime('30 sec'),
	timer: Tools.fromHumanTime('1 min'),
};
