import { parsePoint } from '@/utils/grid';
import { sample } from '@/utils/random';

import type { NoTranslate } from '@/i18n/types';
import type { PSCommand } from '@/types/chat';

export const command: PSCommand = {
	name: 'sample',
	help: 'Generates random numbers.',
	syntax: 'CMD [max=9] x [count=5]',
	categories: ['utility'],
	aliases: ['random'],
	async run({ arg, broadcast, originalCommand }) {
		const [max, count] = parsePoint(arg) ?? [9, 5];
		const nums =
			originalCommand[0] === 'random'
				? Array.from({ length: count }, () => sample(max) + 1)
				: Array.from({ length: max }, (_, index) => index + 1).sample(count);
		broadcast(nums.sortBy(null, 'asc').join(', ') as NoTranslate);
	},
};
