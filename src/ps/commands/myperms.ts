import { RANK_ORDER } from '@/ps/constants';

import type { PSCommand } from '@/types/chat';

export const command: PSCommand = {
	name: 'myperms',
	help: 'Displays your highest permissions',
	syntax: 'CMD',
	aliases: ['me'],
	categories: ['utility'],
	async run({ message, broadcast, checkPermissions, $T }) {
		const highestRank = RANK_ORDER.findLast(rank => checkPermissions(rank));
		if (!highestRank) throw new Error(`You are the lowest of the low. This shouldn't have happened for you, ${message.author.name}.`);
		broadcast($T('COMMANDS.RANK', { rank: highestRank }));
	},
};
