import { ScrabbleMods } from '@/ps/games/scrabble/constants';
import { ScrabbleModData } from '@/ps/games/scrabble/mods';
import { GamesList } from '@/ps/games/types';
import { fromHumanTime } from '@/utils/humanTime';

import type { Meta } from '@/ps/games/types';

export const meta: Meta = {
	name: 'Scrabble',
	id: GamesList.Scrabble,
	aliases: ['scrab'],
	abbr: 'Scrab',

	players: 'many',
	minSize: 2,
	maxSize: 4,

	mods: {
		list: ScrabbleMods,
		data: ScrabbleModData,
	},

	autostart: false,
	pokeTimer: fromHumanTime('1 min'),
	timer: fromHumanTime('5 min'),

	htp: {
		goal: 'Get the most points by placing letters on the board to form words.',
		sections: [
			{
				title: 'Setup',
				lines: [
					'- Each player gets 7 letter from A-Z and blanks (represent any letter) to use',
					'- First word must be at least 2 letters, covering center star square',
				],
			},
			{
				title: 'Gameplay',
				lines: [
					'- Players take turn using letters to form words vertically or horizontally',
					'- Every new word must connect to at least one letter already on the board',
					'- All words formed by your play must be valid Scrabble words',
					'- After turn end, draw new tiles to bring your hand back up to 7 tiles',
					'- You may also choose to swap at least 2 letters instead of making a word, or pass the turn',
				],
			},
			{
				title: 'Scores',
				lines: [
					'- Points are based on letter values + board multipliers',
					'- Playing all 7 letters in one turn gives bonus 50 points',
				],
				subsections: [
					{
						title: 'Letter values:',
						lines: [
							'A=1, B=3, C=3, D=2, E=1, F=4, G=2, H=4, I=1, J=8, K=5, L=1, M=3, N=1, O=1, P=3, Q=10, R=1, S=1, T=1, U=1, V=4, W=4, X=8, Y=4, Z=10',
						],
					},
					{
						title: 'Board multipliers:',
						lines: [
							'- Double letter score (DLS): Double the value of one letter',
							'- Triple letter score (TLS): Triple the value of one letter',
							'- Double word score (DWS): Double the score of the entire word',
							'- Triple word score (TWS): Triple the score of the entire word',
						],
					},
				],
			},
			{
				title: 'Win conditions',
				lines: [
					'- Game ends when all tiles are drawn and one player empties their rack, or when no player can make a move',
					'- Highest score wins',
				],
			},
		],
	},
	// UGO-CODE
	ugo: {
		cap: 6,
		points: {
			win: 25,
			draw: 18,
			loss: 15,
		},
	},
};
