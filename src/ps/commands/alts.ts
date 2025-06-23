import { getAlts } from '@/database/alts';
import { toId } from '@/tools';
import { ChatError } from '@/utils/chatError';

import type { PSCommand } from '@/types/chat';

function isPublicStaff([room, { isPrivate }]: [string, { isPrivate?: boolean }]): boolean {
	if (isPrivate) return false;
	return /^[%@*#]/.test(room);
}

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
			if (!checkPermissions(['room', 'driver']) && !checkPermissions(['global', 'voice'])) {
				const isPublicRoomStaff = message.author.rooms && Object.entries(message.author.rooms).some(isPublicStaff);
				if (!isPublicRoomStaff) throw new ChatError($T('ACCESS_DENIED'));
			}
			lookup = toId(arg);
		}
		const altsList = await getAlts(lookup);
		// TODO: Handle no-alts case
		message.privateReply($T('COMMANDS.ALTS', { alts: altsList.join(', ') }));
	},
};
