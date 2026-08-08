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
					'- Each player gets 7 letters (A-Z and blanks, which can represent any letter)',
					'- The first word must cover the center (star) square',
				],
			},
			{
				title: 'Gameplay',
				lines: [
					'- Players take turn using letters to form words vertically or horizontally',
					'- Every new word must connect to at least one letter already on the board',
					'- All words formed by your play must be valid Scrabble words',
					'- After turn end, draw new tiles to bring your hand back up to 7 tiles',
					'- You may also choose to swap letters with the bag instead of making a word, or pass the turn',
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
						title: 'Board multipliers:',
						lines: [
							'- Double letter score (light blue): Double the value of one letter',
							'- Triple letter score (dark blue): Triple the value of one letter',
							'- Double word score (pink): Double the score of the entire word',
							'- Triple word score (red): Triple the score of the entire word',
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
