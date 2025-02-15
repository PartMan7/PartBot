import { checkPermissions } from '@/ps/handlers/permissions';
import { ChatError } from '@/utils/chatError';

import type { NoTranslate } from '@/i18n/types';
import type { PSCommand } from '@/types/chat';

export const command: PSCommand = {
	name: 'echo',
	help: 'Echoes the given text',
	syntax: 'CMD (text)',
	aliases: ['do'],
	perms: ['room', 'voice'],
	async run({ message, originalCommand: [originalCommand], arg, $T }) {
		if (originalCommand === 'do') {
			if (checkPermissions('admin', message)) message.reply(arg as NoTranslate);
			else throw new ChatError($T('ACCESS_DENIED'));
		} else message.reply(`[[ ]]${arg}` as NoTranslate);
	},
};
