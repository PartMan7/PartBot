import { ChatError } from '@/utils/chatError';
import { parsePoint } from '@/utils/grid';

import type { NoTranslate } from '@/i18n/types';
import type { PSCommand } from '@/types/chat';

const VOWELS = ['A', 'E', 'I', 'O', 'U'];
const CONSONANTS = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];

export const command: PSCommand = {
	name: 'lettersample',
	help: 'Generates random letters.',
	syntax: 'CMD [vowels count] x [consonant count]',
	async run({ arg, broadcast, $T }) {
		const input = arg ? parsePoint(arg) : [5, 5];
		if (!input) throw new ChatError($T('INVALID_ARGUMENTS'));
		const [vowelCount, consonantCount] = input;
		const vowels = Array.from({ length: vowelCount }, () => VOWELS.random())
			.sort()
			.list($T);
		const consonants = Array.from({ length: consonantCount }, () => CONSONANTS.random())
			.sort()
			.list($T);
		broadcast(`${vowels} ${consonants}` as NoTranslate);
	},
};
