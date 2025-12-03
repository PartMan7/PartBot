import { PSAltCache, PSGames, PSJoinphraseCache, PSSeenCache } from '@/cache';
import { rename } from '@/database/alts';
import { seeUser } from '@/database/seens';
import { ChatError } from '@/utils/chatError';
import { debounce } from '@/utils/debounce';
import { fromHumanTime } from '@/utils/humanTime';
import { toId } from '@/utils/toId';

import type { PSMessage } from '@/types/ps';
import type { Client } from 'ps-client';

const minimumMessages: number = 5,
	minimumTime: number = 30; // seconds

interface jpState {
	messageCount: number; // messages since last jp
	lastTime: number; // timestamp of last jp
}
const jpStateMap: Partial<Record<string, jpState>> = {};

export function otherHandler(message: PSMessage) {
	if (message.isIntro) return;
	if (!message.author || !message.author.userid || !message.target || message.author.id === message.parent.status.userid) return;
	if (message.content.startsWith('|')) return;
	const roomId = message.target.id;

	for (const key in jpStateMap) {
		if (!jpStateMap[key]) continue;

		const rId = key.split('-')[1];
		if (rId !== roomId) continue;

		jpStateMap[key]!.messageCount++;
	} // increment message count for each joinphrase in the room
}

export function joinHandler(this: Client, room: string, user: string, isIntro: boolean): void {
	if (isIntro) return;

	const userId = toId(user),
		roomId = toId(room);
	const key = `${userId}-${roomId}`;
	const phrase = PSJoinphraseCache[key]?.phrase;
	if (!phrase) return;

	let state = jpStateMap[key];
	if (!state) {
		state = { messageCount: minimumMessages, lastTime: 0 };
		jpStateMap[key] = state;
	}
	const now = Date.now() / 1000;
	const minimumMessagesReached: boolean = state.messageCount >= minimumMessages;
	const minimumTimeReached: boolean = now - state.lastTime >= minimumTime;
	if (!minimumTimeReached || !minimumMessagesReached) {
		return;
	}
	this.getRoom(room).send(phrase);
	state.messageCount = 0;
	state.lastTime = now;

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
