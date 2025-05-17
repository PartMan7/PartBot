import { abilities, items, moves, pokedex } from 'ps-client/data';

import { Dictionaries, ScrabbleMods } from '@/ps/games/scrabble/constants';
import { CRAZYMONS_SCORING, POKEMON_SCORING, ScrabbleModData } from '@/ps/games/scrabble/mods';

import type { WordScore } from '@/ps/games/scrabble/types';

function isPokeWord(word: string): boolean {
	if (word in abilities) return true;
	if (word in items) return true;
	if (word in moves) return true;
	if (word in pokedex) return true;
	return false;
}

export function checkWord(word: string, appliedMod: ScrabbleMods | null): WordScore | null {
	const mod = appliedMod ?? ScrabbleMods.CSW21;
	const modData = ScrabbleModData[mod];
	const dictionary = Dictionaries[modData.dict];
	if (!dictionary) throw new Error(`Unrecognized dictionary ${modData.dict}`);
	let query = word.toLowerCase();
	switch (mod) {
		case ScrabbleMods.POKEMON:
		case ScrabbleMods.CRAZYMONS: {
			if (isPokeWord(query)) {
				if (mod === ScrabbleMods.POKEMON) return POKEMON_SCORING;
				if (mod === ScrabbleMods.CRAZYMONS) return CRAZYMONS_SCORING;
			}
			break;
		}
		case ScrabbleMods.CLABBERS: {
			query = query.split('').sort().join('');
			break;
		}
	}
	if (query in dictionary) return [1, 0];
	return null;
}
