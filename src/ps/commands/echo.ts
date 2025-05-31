import { ChatError } from '@/utils/chatError';

import type { NoTranslate } from '@/i18n/types';
import type { PSCommand } from '@/types/chat';

export const command: PSCommand = {
	name: 'echo',
	help: 'Echoes the given text',
	syntax: 'CMD (text)',
	aliases: ['do'],
	perms: 'voice',
	categories: ['casual'],
	async run({ message, originalCommand: [originalCommand], arg, $T, checkPermissions }) {
		if (originalCommand === 'do') {
			if (!checkPermissions('admin')) throw new ChatError($T('ACCESS_DENIED'));
			message.reply(arg as NoTranslate);
		} else message.reply(`[[ ]]${arg}` as NoTranslate);
	},
};
