import Clabbers from '@/static/words/clabbers.json';
import CSW19 from '@/static/words/csw19.json';
import CSW21 from '@/static/words/csw21.json';
import ODS8 from '@/static/words/ods8.json';

import type { BaseBoard as BaseBoardType, LetterMetadata } from '@/ps/games/scrabble/types';

export const BaseBoard: BaseBoardType = [
	['3W', null, null, '2L', null, null, null, '3W', null, null, null, '2L', null, null, '3W'],
	[null, '2W', null, null, null, '3L', null, null, null, '3L', null, null, null, '2W', null],
	[null, null, '2W', null, null, null, '2L', null, '2L', null, null, null, '2W', null, null],
	['2L', null, null, '2W', null, null, null, '2L', null, null, null, '2W', null, null, '2L'],
	[null, null, null, null, '2W', null, null, null, null, null, '2W', null, null, null, null],
	[null, '3L', null, null, null, '3L', null, null, null, '3L', null, null, null, '3L', null],
	[null, null, '2L', null, null, null, '2L', null, '2L', null, null, null, '2L', null, null],
	['3W', null, null, '2L', null, null, null, '2*', null, null, null, '2L', null, null, '3W'],
	[null, null, '2L', null, null, null, '2L', null, '2L', null, null, null, '2L', null, null],
	[null, '3L', null, null, null, '3L', null, null, null, '3L', null, null, null, '3L', null],
	[null, null, null, null, '2W', null, null, null, null, null, '2W', null, null, null, null],
	['2L', null, null, '2W', null, null, null, '2L', null, null, null, '2W', null, null, '2L'],
	[null, null, '2W', null, null, null, '2L', null, '2L', null, null, null, '2W', null, null],
	[null, '2W', null, null, null, '3L', null, null, null, '3L', null, null, null, '2W', null],
	['3W', null, null, '2L', null, null, null, '3W', null, null, null, '2L', null, null, '3W'],
];

export const RACK_SIZE = 7;
export const WIDE_LETTERS = ['Q', 'W', 'Z'];

export const LETTER_COUNTS: LetterMetadata = {
	A: 9,
	B: 2,
	C: 2,
	D: 4,
	E: 12,
	F: 2,
	G: 3,
	H: 2,
	I: 9,
	J: 1,
	K: 1,
	L: 4,
	M: 2,
	N: 6,
	O: 8,
	P: 2,
	Q: 1,
	R: 6,
	S: 4,
	T: 6,
	U: 4,
	V: 2,
	W: 2,
	X: 1,
	Y: 2,
	Z: 1,
	_: 2,
};

export const LETTER_POINTS: LetterMetadata = {
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
	K: 5,
	L: 1,
	M: 3,
	N: 1,
	O: 1,
	P: 3,
	Q: 10,
	R: 1,
	S: 1,
	T: 1,
	U: 1,
	V: 4,
	W: 4,
	X: 8,
	Y: 4,
	Z: 10,
	_: 0,
};

export const SELECT_ACTION_PATTERN = /^s(?<pos>[A-Z0-9]{2})$/;
export const PLAY_ACTION_PATTERN = /^p(?<pos>[A-Z0-9]{2})(?<dir>[dr])$/;

export enum DIRECTION {
	RIGHT = 'right',
	DOWN = 'down',
}

export enum DICTIONARY {
	CSW19 = 'csw19',
	CSW21 = 'csw21',
	ODS8 = 'ods8',
	CLABBERS = 'clabbers',
}

export const Dictionaries = {
	[DICTIONARY.CSW19]: CSW19,
	[DICTIONARY.CSW21]: CSW21,
	[DICTIONARY.CLABBERS]: Clabbers,
	[DICTIONARY.ODS8]: ODS8,
	// TypeScript gets its pants in a twirl here with JSON stuff
} as unknown as Record<DICTIONARY, Record<string, boolean>>;

export enum ScrabbleMods {
	CSW19 = 'csw19',
	CSW21 = 'csw21',
	ODS8 = 'ods8',
	CLABBERS = 'clabbers',
	POKEMON = 'pokemon',
	CRAZYMONS = 'crazymons',
}
