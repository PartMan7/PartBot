import type { NoTranslate } from '@/i18n/types';
import type { PSCommand } from '@/types/chat';

export const command: PSCommand = {
	name: 'randpoke',
	help: 'Starts a randpoke param search.',
	syntax: 'CMD',
	rooms: ['scavengers'],
	perms: ['room', 'voice'],
	categories: ['casual'],
	async run({ message }) {
		message.reply('!randpoke 2, FE, NatDex' as NoTranslate);
	},
};
