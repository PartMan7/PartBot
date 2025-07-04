import type { NoTranslate } from '@/i18n/types';
import type { PSCommand } from '@/types/chat';

export const command: PSCommand = {
	name: 'git',
	help: 'Links the GitHub repository.',
	syntax: 'CMD',
	flags: { allowPMs: true },
	categories: ['utility'],
	async run({ broadcast }) {
		broadcast('https://github.com/PartMan7/PartBot' as NoTranslate);
	},
};
