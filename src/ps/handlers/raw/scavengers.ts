import { unescapeHTML } from 'ps-client/tools';

import { HUNT_ANNOUNCEMENTS_CHANNEL, HUNT_BY_ROLE } from '@/discord/constants/servers/scavengers';
import { getChannel } from '@/discord/loaders/channels';
import { IS_ENABLED } from '@/enabled';

const HUNT_START_PATTERN =
	// eslint-disable-next-line max-len -- Regular Expression
	/^<div class="broadcast-blue"><strong>A new (?<type>regular|official|practice|recycled|unrated|mini) scavenger hunt by <em>(?<maker>.*)<\/em> has been started(?<qcer>(?: by <em>(.*)<\/em>)?)\.<\/strong><div style="[^"]*"><strong><em>Hint #1:<\/em> .*<\/strong><\/div>\(To answer, use <kbd>\/scavenge <em>ANSWER<\/em><\/kbd>\)<\/div>$/;

export function checkHunts(room: string, data: string) {
	if (!['scavengers', 'treasuretown', 'groupchat-scavengers-partmantesting'].includes(room)) return;
	if (!IS_ENABLED.DISCORD) return;
	const huntChannel = getChannel(HUNT_ANNOUNCEMENTS_CHANNEL);
	if (!huntChannel) return;
	const isMainRoom = room === 'scavengers';
	const huntStart = data.match(HUNT_START_PATTERN) as {
		groups: {
			type: 'regular' | 'official' | 'practice' | 'recycled' | 'unrated' | 'mini';
			maker: string;
			qcer?: string;
		};
	} | null;
	if (!huntStart) return;
	const { type: huntType, maker } = huntStart.groups;

	function post(message: string): void {
		const sanitized = unescapeHTML(message.replace(/@(?=here|everyone)/, '@\u200b'));
		huntChannel!.send(sanitized);
	}

	const sideRoom = isMainRoom ? '' : ' in Treasure Town';
	switch (huntType) {
		case 'regular':
			return post(`@here A regular hunt by ${maker} has been started${sideRoom}!`);
		case 'official':
			return post(`@here An official hunt by ${maker} has been started${sideRoom} let's goooooooo`);
		case 'mini':
			return post(`@here A mini-official hunt by ${maker} has been started${sideRoom} let's moooooooo`);
		case 'practice':
			return post(
				`A practice ${HUNT_BY_ROLE} ${maker} has been started${sideRoom}! A mini-official or official hunt will be starting soon!`
			);
		case 'recycled':
			return post(`A recycled hunt by ${maker} has been started${sideRoom}!`);
		case 'unrated':
			return post(`An unrated hunt by ${maker} has been started${sideRoom}!`);
		default:
			return post(`A ${huntType} hunt has been started${sideRoom} but I have no idea what that is`);
	}
}
