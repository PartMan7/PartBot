import { PSAltCache, PSSeenCache } from '@/cache';
import { rename } from '@/database/alts';
import { seeUser } from '@/database/seens';
import { fromHumanTime, toId } from '@/tools';
import { log } from '@/utils/logger';

import type { Client } from 'ps-client';

export function joinHandler(this: Client, room: string, user: string, isIntro: boolean): void {
	if (isIntro) return;
	// Joinphrases
	// 'Stalking'
	// (Kinda creepy name for the feature, but it CAN be used in creepy ways so make sure it's regulated!)
}

export function nickHandler(this: Client, room: string, newName: string, oldName: string, isIntro: boolean): void {
	if (isIntro) return;
	const from = toId(oldName),
		to = toId(newName),
		id = `${from}-${to}`;
	if (from === to) return;
	// Throttling cache updates at once per 5s per rename (A-B)
	if (Date.now() - PSAltCache[id]?.at.getTime() < fromHumanTime('5 seconds')) return;
	PSAltCache[id] = { from, to, at: new Date() };
	rename(oldName, newName);
}

export function leaveHandler(this: Client, room: string, user: string, isIntro: boolean): void {
	if (isIntro) return;
	const userId = toId(user);
	// Throttling cache updates at once per 5s per leave
	if (Date.now() - PSSeenCache[userId]?.at.getTime() < fromHumanTime('5 seconds')) return;
	const userObj = this.getUser(user);
	const rooms = userObj && userObj.rooms ? Object.keys(userObj.rooms).map(room => room.replace(/^[^a-z0-9]/, '')) : [room];
	PSSeenCache[userId] = { at: new Date(), in: rooms };
	seeUser(user, rooms);
}
