import { lastSeen } from '@/database/seens';
import { toHumanTime } from '@/utils/humanTime';
import { toId, toRoomId } from '@/utils/toId';

import type { PSCommand } from '@/types/chat';
import type { PSMessage } from '@/types/ps';
import type { Client } from 'ps-client';

function authorInRoom(author: PSMessage['author'], roomId: string): boolean {
	return author.rooms && Object.keys(author.rooms).some(room => toRoomId(room) === roomId);
}

function isDisclosableSeenRoom(roomId: string, client: Client, message: PSMessage): boolean {
	if (roomId.startsWith('groupchat-') || roomId.startsWith('battle-') || roomId.startsWith('view-')) return false;
	const room = client.getRoom(roomId);
	if (!room || room.type !== 'chat') return false;
	if (room.visibility === 'public') return true;
	if (room.visibility === 'secret' && message.type === 'pm' && authorInRoom(message.author, roomId)) return true;
	return false;
}

export const command: PSCommand = {
	name: 'seens',
	help: "Shows when you last saw a user leave, or if they're online.",
	syntax: 'CMD user',
	flags: { allowPMs: true },
	aliases: ['getseens', 'seen'],
	categories: ['utility'],

	async run({ message, arg, $T, broadcast }) {
		if (!arg || toId(arg) === message.author.userid) return message.privateReply($T('COMMANDS.SEENS.SELF'));

		const lookup = toId(arg);
		const online = message.parent.getUser(lookup);
		const lastSeenUser = await lastSeen(lookup);
		const displayUser = online?.name ?? lastSeenUser?.name ?? lookup;
		if (online) return broadcast($T('COMMANDS.SEENS.ONLINE', { user: displayUser }));
		const seen = lastSeenUser;
		if (!seen) return broadcast($T('COMMANDS.SEENS.NEVER', { user: displayUser }));

		const at = seen.at instanceof Date ? seen.at.getTime() : +seen.at;
		const time = toHumanTime(Date.now() - at, undefined, $T);
		const room = seen.seenIn.find(roomId => isDisclosableSeenRoom(roomId, message.parent, message));
		if (room) broadcast($T('COMMANDS.SEENS.LAST_IN', { user: displayUser, room, time }));
		else broadcast($T('COMMANDS.SEENS.LAST', { user: displayUser, time }));
	},
};
