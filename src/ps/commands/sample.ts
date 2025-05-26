import { parsePoint } from '@/utils/grid';
import { sample } from '@/utils/random';

import type { PSCommand } from '@/types/chat';

export const command: PSCommand = {
	name: 'sample',
	help: 'Generates random numbers.',
	syntax: 'CMD [max=10] x [count=5]',
	aliases: ['random'],
	async run({ arg, broadcast, originalCommand }) {
		const [max, count] = parsePoint(arg) ?? [10, 5];
		const nums =
			originalCommand[0] === 'random'
				? Array.from({ length: count }, () => sample(max) + 1)
				: Array.from({ length: count }, (_, index) => index + 1).sample(count);
		broadcast(nums.join(', '));
	},
};
