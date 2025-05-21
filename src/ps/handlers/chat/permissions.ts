import { PSRoomConfigs } from '@/cache';
import { admins } from '@/config/ps';
import customPerms from '@/ps/handlers/chat/customPerms';

import type { Perms } from '@/types/perms';
import type { PSMessage } from '@/types/ps';

const knownRankMappings: Record<string, Perms & string> = {
	'‽': 'locked',
	'!': 'muted',
	' ': 'regular',
	'^': 'regular',
	'+': 'voice',
	'*': 'bot',
	'%': 'driver',
	'§': 'driver',
	'@': 'mod',
	'#': 'owner',
	'&': 'owner',
};
export const rankOrder: (Perms & string)[] = [
	'locked',
	'muted',
	'regular',
	'whitelist',
	'voice',
	'bot',
	'driver',
	'mod',
	'owner',
	'admin',
];

export function getRank(symbol: string, unrecognizedRank: Perms & string = 'regular'): Perms & string {
	if (symbol in knownRankMappings) return knownRankMappings[symbol];
	return unrecognizedRank;
}

function baseCheckPermissions(perm: Exclude<Perms, symbol>, message: PSMessage): boolean {
	// Admin overrides
	const isAdmin = admins.includes(message.author.userid);
	if (isAdmin) return true;
	// Other overrides are applied only on rank and [scope, rank], not functions
	switch (typeof perm) {
		case 'string': {
			return rankOrder.indexOf(getRank(message.msgRank ?? ' ')) >= rankOrder.indexOf(perm);
		}
		case 'object': {
			const [level, rank] = perm;
			const permIndex = rankOrder.indexOf(rank);
			const globalRank = message.author.group ?? ' ';
			if (level === 'global' || message.type === 'pm') return rankOrder.indexOf(getRank(globalRank)) >= permIndex;
			const roomAuth = message.target.auth;
			const roomRank = Object.keys(roomAuth ?? {}).find(rank => roomAuth?.[rank].includes(message.author.userid)) ?? ' ';
			const roomIndex = rankOrder.indexOf(getRank(roomRank));
			if (level === 'room') return roomIndex >= permIndex;
			else return Math.max(roomIndex, rankOrder.indexOf(getRank(globalRank))) >= permIndex;
		}
		case 'function': {
			return perm(message);
		}
		default:
			return false;
	}
}

export function checkPermissions(perm: Perms, command: string[] | null, message: PSMessage): boolean {
	if (perm === 'admin') return baseCheckPermissions(perm, message); // Don't allow overriding admin perms in any way or form
	const lookup = command?.join('.') ?? null;
	const roomConfig = message.type === 'chat' ? PSRoomConfigs[message.target.id] : null;
	if (lookup) {
		if (roomConfig?.permissions?.[lookup]) return checkPermissions(roomConfig.permissions[lookup], null, message);
	}
	if (typeof perm === 'symbol') {
		if (perm in customPerms) {
			const symbolName = Symbol.keyFor(perm)!;
			if (roomConfig?.permissions?.[symbolName]) return checkPermissions(roomConfig.permissions[symbolName], null, message);
			return baseCheckPermissions(customPerms[perm], message);
		}
		return false;
	} else return baseCheckPermissions(perm, message);
}
