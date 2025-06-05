import type { NoTranslate } from '@/i18n/types';
import type { PSCommand } from '@/types/chat';

export const command: PSCommand = {
	name: 'pat',
	help: 'Pats a person.',
	syntax: 'CMD [user?]',
	perms: 'voice',
	aliases: ['pet'],
	categories: ['casual'],
	async run({ message, arg }) {
		return message.reply(`/me pats ${message.author.id === 'hydrostatics' ? 'Hydro' : arg}` as NoTranslate);
	},
};
