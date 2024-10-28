import { Perms } from '@/types/perms';
import customPerms from '@/ps/handlers/custom-perms';

import { admins } from '@/config/ps';

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
const rankOrder: (Perms & string)[] = ['locked', 'muted', 'regular', 'whitelist', 'voice', 'bot', 'driver', 'mod', 'owner', 'admin'];

export function getRank(symbol: string, unrecognizedRank: Perms & string = 'regular'): Perms & string {
	if (symbol in knownRankMappings) return knownRankMappings[symbol];
	return unrecognizedRank;
}

function _checkPermissions(perm: Exclude<Perms, symbol>, message: PSMessage): boolean {
	// Admin overrides
	const isAdmin = admins.includes(message.author.userid);
	if (isAdmin) return true;
	// Other overrides are applied only on rank and [scope, rank], not functions
	switch (typeof perm) {
		case 'string': {
			return rankOrder.indexOf(getRank(message.msgRank)) >= rankOrder.indexOf(perm);
		}
		case 'object': {
			const [level, rank] = perm;
			const permIndex = rankOrder.indexOf(rank);
			const globalRank = message.author.group ?? ' ';
			if (level === 'global' || message.type === 'pm') return rankOrder.indexOf(getRank(globalRank)) >= permIndex;
			const roomAuth = message.target.auth;
			const roomRank = Object.keys(roomAuth).find(rank => roomAuth[rank].includes(message.author.userid)) ?? ' ';
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

export function checkPermissions(perm: Perms, message: PSMessage): boolean {
	if (typeof perm === 'symbol') {
		if (perm in customPerms) return _checkPermissions(customPerms[perm], message);
		return false;
	} else return _checkPermissions(perm, message);
}
