import type { PSCommand } from '@/types/chat';

export const command: PSCommand = {
	name: 'git',
	help: 'Links the GitHub repository',
	syntax: 'CMD',
	category: ['utility'],
	async run({ broadcast }) {
		broadcast('https://github.com/PartMan7/PartBotter');
	},
};
