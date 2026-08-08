import { GamesList } from '@/ps/games/types';

import type { Meta } from '@/ps/games/types';

export const meta: Meta = {
	name: 'Lights Out',
	id: GamesList.LightsOut,
	aliases: ['lo'],
	abbr: 'lo',
	players: 'single',

	htp: {
		goal: 'Turn all the lights off! Bonus points if you can beat PartBot :p',
		sections: [
			{
				title: 'How to Play',
				lines: [
					'- The game is played on a 5×5 grid of lights.',
					'- When you click on a light, it toggles (turns on or off), including adjacent lights (up, down, left, right).',
					'- A helpful guide: https://www.logicgamesonline.com/lightsout/tutorial.html',
				],
			},
		],
	},

	// UGO-CODE
	ugo: null,
};
