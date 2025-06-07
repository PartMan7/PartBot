import { PSAltCache, PSGames, PSSeenCache } from '@/cache';
import { rename } from '@/database/alts';
import { seeUser } from '@/database/seens';
import { fromHumanTime, toId } from '@/tools';
import { debounce } from '@/utils/debounce';

import type { Client } from 'ps-client';

export function joinHandler(this: Client, room: string, user: string, isIntro: boolean): void {
	if (isIntro) return;
	// Joinphrases
	// 'Stalking'
	// (Kinda creepy name for the feature, but it CAN be used in creepy ways so make sure it's regulated!)

	// Check if there's any relevant games
	const roomGames = Object.values(PSGames)
		.flatMap(gamesList => Object.values(gamesList))
		.filter(game => game.roomid === room);

	roomGames.forEach(game => {
		if (game.hasPlayerOrSpectator(user)) game.update(toId(user));
	});
}

const DebounceAltCache: Record<string, { at: Date; call: () => void }> = {};
export function nickHandler(this: Client, room: string, newName: string, oldName: string, isIntro: boolean): void {
	if (isIntro) return;
	const from = toId(oldName),
		to = toId(newName),
		id = `${from}-${to}`;
	if (from === to) return;
	// Throttling cache updates at once per 5s per rename (A-B)
	// TODO: Use debounce
	DebounceAltCache[id] ??= {
		at: new Date(),
		call: debounce(() => rename(oldName, newName), fromHumanTime('5 seconds')),
	};
	DebounceAltCache[id].at = new Date();
	PSAltCache[id] = { from, to, at: new Date() };
	DebounceAltCache[id].call();
}

const DebounceSeenCache: Record<string, { name: string; at: Date; call: (rooms: string[]) => void }> = {};
export function leaveHandler(this: Client, room: string, name: string, isIntro: boolean): void {
	if (isIntro) return;
	const userId = toId(name);
	// Throttling cache updates at once per 5s per leave
	DebounceSeenCache[userId] ??= {
		name,
		at: new Date(),
		call: debounce(rooms => seeUser(name, rooms, DebounceSeenCache[userId].at), fromHumanTime('5 seconds')),
	};
	DebounceSeenCache[userId].at = new Date();
	const userObj = this.getUser(name);
	const rooms = userObj && userObj.rooms ? Object.keys(userObj.rooms).map(room => room.replace(/^[^a-z0-9]/, '')) : [room];
	PSSeenCache[userId] = { id: userId, name: name, at: new Date(), seenIn: rooms };
	DebounceSeenCache[userId].call(rooms);
}
