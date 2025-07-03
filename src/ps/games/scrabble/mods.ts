import { DICTIONARY, ScrabbleMods } from '@/ps/games/scrabble/constants';

import type { LetterMetadata, WordScore } from '@/ps/games/scrabble/types';

export const ScrabbleModData: Record<
	ScrabbleMods,
	{ name: string; dict: DICTIONARY; aliases?: string[]; points?: LetterMetadata; counts?: LetterMetadata }
> = {
	[ScrabbleMods.CSW19]: {
		name: 'CSW19',
		dict: DICTIONARY.CSW19,
	},
	[ScrabbleMods.CSW21]: {
		name: 'CSW21',
		dict: DICTIONARY.CSW21,
	},
	[ScrabbleMods.ODS8]: {
		name: 'ODS8',
		dict: DICTIONARY.ODS8,
		counts: {
			A: 9,
			B: 2,
			C: 2,
			D: 3,
			E: 15,
			F: 2,
			G: 2,
			H: 2,
			I: 8,
			J: 1,
			K: 1,
			L: 5,
			M: 3,
			N: 6,
			O: 6,
			P: 2,
			Q: 1,
			R: 6,
			S: 6,
			T: 6,
			U: 6,
			V: 2,
			W: 1,
			X: 1,
			Y: 1,
			Z: 1,
			_: 2,
		},
		points: {
			A: 1,
			B: 3,
			C: 3,
			D: 2,
			E: 1,
			F: 4,
			G: 2,
			H: 4,
			I: 1,
			J: 8,
			K: 10,
			L: 1,
			M: 2,
			N: 1,
			O: 1,
			P: 3,
			Q: 8,
			R: 1,
			S: 1,
			T: 1,
			U: 1,
			V: 4,
			W: 10,
			X: 10,
			Y: 10,
			Z: 10,
			_: 0,
		},
		aliases: ['ods', 'french', 'francais', 'franais'],
	},
	[ScrabbleMods.CLABBERS]: {
		name: 'Clabbers',
		dict: DICTIONARY.CLABBERS,
	},
	[ScrabbleMods.POKEMON]: {
		name: 'Pokémon',
		dict: DICTIONARY.CSW21,
		aliases: ['pokemod', 'pokmon', 'pkmn', 'mons'],
	},
	[ScrabbleMods.CRAZYMONS]: {
		name: 'CRAZYMONS',
		dict: DICTIONARY.CSW21,
		aliases: ['crazy'],
	},
};

export const POKEMON_SCORING: WordScore = [2, 10];
export const CRAZYMONS_SCORING: WordScore = [5, 0];
