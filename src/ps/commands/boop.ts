import type { PSCommand } from '@/types/chat';

export const command: PSCommand = {
	name: 'boop',
	help: 'Boops',
	syntax: 'CMD',
	perms: ['room', 'mod'],
	categories: ['casual'],
	async run({ message, $T }) {
		return message.reply($T('COMMANDS.BOOP'));
	},
};
