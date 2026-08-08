import { GamesList } from '@/ps/games/types';

import type { Meta } from '@/ps/games/types';

export const meta: Meta = {
	name: 'Mastermind',
	id: GamesList.Mastermind,
	aliases: ['mm'],
	abbr: 'mm',
	players: 'single',

	htp: {
		goal: 'Guess the 4 digit code before your guesses run out!',
		sections: [
			{
				title: 'How to Play',
				lines: [
					'- Numbers go from 0-7, and they can repeat.',
					'- Red pin - correct number correct position',
					'- White pin - correct number wrong position',
					'- No pin - incorrect number',
					"- Reds/Whites don't specify that the number in the corresponding position is correct.",
				],
			},
			{
				title: 'Example',
				lines: [
					"Let's assume the code is 0167...",
					'- Guess: 1234. Result: White. (1 is the only correct number but in the wrong position.)',
					'- Guess: 2567. Result: Red-Red. (6,7 are correct numbers and correct positions.)',
					'- Guess: 6723. Result: White-White. (6,7 are correct numbers but in the wrong positions.)',
					'- Guess: 2345. Result: Nothing. (All numbers are incorrect.)',
				],
			},
		],
	},
	// UGO-CODE
	ugo: null,
};
