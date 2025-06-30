import { DICTIONARY, ScrabbleMods } from '@/ps/games/scrabble/constants';

import type { WordScore } from '@/ps/games/scrabble/types';

export const ScrabbleModData: Record<ScrabbleMods, { name: string; dict: DICTIONARY; aliases?: string[] }> = {
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
