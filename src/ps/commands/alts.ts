import { getAlts } from '@/database/alts';
import { ChatError } from '@/utils/chatError';
import { toId } from '@/utils/toId';

import type { PSCommand } from '@/types/chat';

export const command: PSCommand = {
	name: 'alts',
	help: "Lists a user's alts. Requires trusted perms to view beyond your own.",
	syntax: 'CMD [user?]',
	flags: { allowPMs: true },
	aliases: ['getalts'],
	categories: ['utility'],
	async run({ message, arg, $T, checkPermissions }) {
		let lookup = message.author.userid;
		if (arg) {
			if (!checkPermissions('trusted')) throw new ChatError($T('ACCESS_DENIED'));
			lookup = toId(arg);
		}
		const altsList = await getAlts(lookup);
		// TODO: Handle no-alts case
		message.privateReply($T('COMMANDS.ALTS', { alts: altsList?.join(', ') ?? 'None' }));
	},
};
