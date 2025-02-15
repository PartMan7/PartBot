import { getAlts } from '@/database/alts';
import { checkPermissions } from '@/ps/handlers/permissions';
import { toId } from '@/tools';
import { ChatError } from '@/utils/chatError';

import type { PSCommand } from '@/types/chat';

export const command: PSCommand = {
	name: 'alts',
	help: 'Testing command',
	syntax: 'CMD USERNAME?',
	aliases: ['getalts'],
	async run({ message, arg, $T }) {
		let lookup = message.author.userid;
		if (arg) {
			if (!checkPermissions(['room', 'driver'], message)) throw new ChatError($T('ACCESS_DENIED'));
			lookup = toId(arg);
		}
		const altsList = await getAlts(lookup);
		message.reply($T('COMMANDS.ALTS', { alts: altsList.join(', ') }));
	},
};
