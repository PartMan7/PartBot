import { getAlts } from '@/database/alts';
import { toId } from '@/tools';
import { ChatError } from '@/utils/chatError';

import type { PSCommand } from '@/types/chat';

export const command: PSCommand = {
	name: 'alts',
	help: "Lists a user's alts. Requires trusted perms to view beyond your own.",
	syntax: 'CMD [user?]',
	aliases: ['getalts'],
	categories: ['utility'],
	async run({ message, arg, $T, checkPermissions }) {
		let lookup = message.author.userid;
		if (arg) {
			// TODO: Change this to use _any_ room
			if (!checkPermissions(['room', 'driver']) && !checkPermissions(['global', 'voice'])) throw new ChatError($T('ACCESS_DENIED'));
			lookup = toId(arg);
		}
		const altsList = await getAlts(lookup);
		// TODO: Handle no-alts case
		message.privateReply($T('COMMANDS.ALTS', { alts: altsList.join(', ') }));
	},
};
