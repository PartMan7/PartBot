import { PSRoomConfigs } from '@/cache';
import { admins } from '@/config/ps';
import { KNOWN_RANK_MAPPINGS, RANK_ORDER } from '@/ps/constants';
import { LivePSStuff } from '@/sentinel/live';

import type { Perms } from '@/types/perms';
import type { AuthKey, PSMessage } from '@/types/ps';

function getRank(symbol: string, unrecognizedRank: Perms & string = 'regular'): Perms & string {
	if (symbol in KNOWN_RANK_MAPPINGS) return KNOWN_RANK_MAPPINGS[symbol];
	return unrecognizedRank;
}

function getConfigRank(message: PSMessage): AuthKey | null {
	if (message.type !== 'chat') return null;
	const roomConfig = PSRoomConfigs[message.target.id];
	if (!roomConfig) return null;
	if (roomConfig.auth) {
		for (const key in roomConfig.auth) {
			const authKey = key as AuthKey;
			if (roomConfig.auth[authKey]?.includes(message.author.id)) return authKey;
		}
	}
	return null;
}

function baseCheckPermissions(perm: Exclude<Perms, symbol>, command: string[] | null, message: PSMessage): boolean {
	// Admin overrides
	const isAdmin = admins.includes(message.author.userid);
	if (isAdmin) return true;
	// Other overrides are applied only on rank and [scope, rank], not functions
	switch (typeof perm) {
		case 'string': {
			const roomConfigRank = getConfigRank(message);
			const roomConfigIndex = roomConfigRank ? RANK_ORDER.indexOf(roomConfigRank) : -1;
			const regularIndex = RANK_ORDER.indexOf(getRank(message.msgRank ?? ' '));
			return Math.max(roomConfigIndex, regularIndex) >= RANK_ORDER.indexOf(perm);
		}
		case 'object': {
			const [level, rank] = perm;
			const permIndex = RANK_ORDER.indexOf(rank);
			const globalRank = message.author.group ?? ' ';
			if (level === 'global' || message.type === 'pm') return RANK_ORDER.indexOf(getRank(globalRank)) >= permIndex;
			const roomAuth = message.target.auth;
			const roomRank = Object.keys(roomAuth ?? {}).find(rank => roomAuth?.[rank].includes(message.author.userid)) ?? ' ';
			const roomConfigRank = getConfigRank(message);
			const roomConfigIndex = roomConfigRank ? RANK_ORDER.indexOf(roomConfigRank) : -1;
			const regularRoomIndex = RANK_ORDER.indexOf(getRank(roomRank));
			const roomIndex = Math.max(roomConfigIndex, regularRoomIndex);
			if (level === 'room') return roomIndex >= permIndex;
			else return Math.max(roomIndex, RANK_ORDER.indexOf(getRank(globalRank))) >= permIndex;
		}
		case 'function': {
			return perm(message, staticPerm => permissions(staticPerm, command, message));
		}
		default:
			return false;
	}
}

export function permissions(perm: Perms, command: string[] | null, message: PSMessage): boolean {
	if (perm === 'admin') return baseCheckPermissions(perm, command, message); // Don't allow overriding admin perms in any way or form
	const lookup = command?.join('.') ?? null;
	const roomConfig = message.type === 'chat' ? PSRoomConfigs[message.target.id] : null;
	if (lookup) {
		if (roomConfig?.permissions?.[lookup]) return permissions(roomConfig.permissions[lookup], null, message);
	}
	if (typeof perm === 'symbol') {
		const groupedPerms = LivePSStuff.commands.GROUPED_PERMS;
		if (perm in groupedPerms) {
			const symbolName = Symbol.keyFor(perm)!;
			if (roomConfig?.permissions?.[symbolName]) return permissions(roomConfig.permissions[symbolName], null, message);
			return baseCheckPermissions(groupedPerms[perm], command, message);
		}
		return false;
	} else return baseCheckPermissions(perm, command, message);
}
