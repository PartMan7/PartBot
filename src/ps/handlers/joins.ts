import { PSAltCache, PSGames, PSJoinphraseCache, PSSeenCache } from '@/cache';
import { rename } from '@/database/alts';
import { seeUser } from '@/database/seens';
import { ChatError } from '@/utils/chatError';
import { debounce } from '@/utils/debounce';
import { fromHumanTime } from '@/utils/humanTime';
import { toId } from '@/utils/toId';

import type { Client } from 'ps-client';

export function joinHandler(this: Client, room: string, user: string, isIntro: boolean): void {
	if (isIntro) return;
	// Joinphrases
	// 'Stalking'
	// (Kinda creepy name for the feature, but it CAN be used in creepy ways so make sure it's regulated!)
	// TODO Add minimum-messages-sent and minimum-time-since-last-occurence conditions
	const userId = toId(user),
		roomId = toId(room);
	const phrase = PSJoinphraseCache[`${userId}-${roomId}`]?.phrase;
	this.getRoom(room).send(phrase ?? '');

	// Check if there's any relevant games
	const roomGames = Object.values(PSGames)
		.flatMap(gamesList => Object.values(gamesList))
		.filter(game => game.roomid === room);

	roomGames.forEach(game => {
		if (game.hasPlayerOrSpectator(user))
			try {
				game.update(userId);
			} catch (err) {
				if (!(err instanceof ChatError)) throw err;
			}
	});
}

const DebounceAltCache: Record<string, { at: Date; call: () => void }> = {};
export function nickHandler(this: Client, room: string, newName: string, oldName: string, isIntro: boolean): void {
	if (isIntro) return;
	const from = toId(oldName),
		to = toId(newName),
		id = `${from}-${to}`;
	if (from === to) return;
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
	DebounceSeenCache[userId] ??= {
		name,
		at: new Date(),
		call: debounce((rooms: string[]) => seeUser(name, rooms.unique(), DebounceSeenCache[userId].at), fromHumanTime('5 seconds')),
	};
	DebounceSeenCache[userId].at = new Date();
	const userObj = this.getUser(name);
	const rooms = userObj && userObj.rooms ? Object.keys(userObj.rooms).map(room => room.replace(/^[^a-z0-9]/, '')) : [room];
	PSSeenCache[userId] = { id: userId, name: name, at: new Date(), seenIn: rooms };
	DebounceSeenCache[userId].call(rooms);
}
