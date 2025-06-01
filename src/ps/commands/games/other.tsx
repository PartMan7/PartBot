import { parseMod } from '@/ps/games/mods';
import { checkWord } from '@/ps/games/scrabble/checker';
import { ScrabbleMods } from '@/ps/games/scrabble/constants';
import { ScrabbleModData } from '@/ps/games/scrabble/mods';
import { toId } from '@/tools';
import { ChatError } from '@/utils/chatError';

import type { PSCommand } from '@/types/chat';

export const command: PSCommand[] = [
	{
		name: 'checkword',
		help: 'Checks the legality of a word according to the Scrabble dictionary.',
		syntax: 'CMD word[, mod]',
		aliases: ['cw'],
		categories: ['game'],
		async run({ broadcast, arg, $T }) {
			const [word, input = ScrabbleMods.CSW21] = arg
				.toLowerCase()
				.replace(/[^a-z0-9,]/g, '')
				.lazySplit(',', 1);
			const mod = parseMod(input, ScrabbleMods, ScrabbleModData);
			if (!mod) throw new ChatError($T('GAME.MOD_NOT_FOUND', { mod: input }));
			const check = checkWord(word, mod);
			if (!check) broadcast($T('GAME.SCRABBLE.INVALID_WORD', { wordList: word }));
			else broadcast($T('GAME.SCRABBLE.VALID_WORD', { word: toId(word).toUpperCase(), mod: ScrabbleModData[mod].name }));
		},
	},
	{
		name: 'othellosequence',
		help: 'Sequence of fastest game in Othello.',
		syntax: 'CMD',
		categories: ['game'],
		async run({ broadcastHTML }) {
			broadcastHTML([['e6', 'f4'], ['e3', 'f6'], ['g5', 'd6'], ['e7', 'f5'], ['c5']].map(turns => turns.join(', ')).join('<br />'));
		},
	},
];
