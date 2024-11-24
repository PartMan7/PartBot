import { PSAltCache, PSSeenCache } from '@/cache';
import { rename } from '@/database/alts';
import { seeUser } from '@/database/seens';

export function joinHandler(room: string, user: string, isIntro: boolean): void {
	if (isIntro) return;
	// Joinphrases
	// 'Stalking'
	// (Kinda creepy name for the feature, but it CAN be used in creepy ways so make sure it's regulated!)
}

export function nickHandler(room: string, newName: string, oldName: string, isIntro: boolean): void {
	if (isIntro) return;
	const from = Tools.toId(oldName),
		to = Tools.toId(newName),
		id = `${from}-${to}`;
	if (from === to) return;
	// Throttling cache updates at once per 5s per rename (A-B)
	if (Date.now() - PSAltCache[id]?.at.getTime() < Tools.fromHumanTime('5 seconds')) return;
	PSAltCache[id] = { from, to, at: new Date() };
	rename(oldName, newName);
}

export function leaveHandler(room: string, user: string, isIntro: boolean): void {
	if (isIntro) return;
	const userId = Tools.toId(user);
	// Throttling cache updates at once per 5s per leave
	if (Date.now() - PSSeenCache[userId]?.at.getTime() < Tools.fromHumanTime('5 seconds')) return;
	const userObj = PS.getUser(user);
	const rooms = userObj && userObj.rooms ? Object.keys(userObj.rooms).map(room => room.replace(/^[^a-z0-9]/, '')) : [room];
	PSSeenCache[userId] = { at: new Date(), in: rooms };
	seeUser(user, rooms);
}
