import { GamesList, Meta } from '@/ps/games/common';

export const meta: Meta = {
	name: 'Othello',
	id: GamesList.Othello,
	aliases: ['otgoodbye'],

	turns: {
		W: 'White',
		B: 'Black',
	},

	allowForfeits: true,
	autostart: true,
};
