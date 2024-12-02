import { toHumanTime } from '@/tools';

import type { PSCommand } from '@/types/chat';

export const command: PSCommand = {
	name: 'uptime',
	help: 'Displays the current uptime.',
	syntax: 'CMD',
	async run({ broadcast }) {
		return broadcast(toHumanTime(process.uptime() * 1000));
	},
};
