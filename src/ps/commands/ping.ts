import type { PSCommand } from '@/types/chat';

export const command: PSCommand = {
	name: 'ping',
	help: "You're asking help on... how to use ping?",
	syntax: 'CMD',
	perms: ['room', 'voice'],
	async run({ message, $T }) {
		return message.reply($T('COMMANDS.PONG'));
	},
};
