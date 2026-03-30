import { unescapeHTML } from 'ps-client/tools';

import { prefix } from '@/config/ps';
import { HUNT_ANNOUNCEMENTS_CHANNEL, HUNT_BY_ROLE } from '@/discord/constants/servers/scavengers';
import { getChannel } from '@/discord/loaders/channels';
import { IS_ENABLED } from '@/enabled';
import { createNonce } from '@/ps/commands/nonce';
import { isUGOActive } from '@/ps/specialEvents';
import { Button } from '@/utils/components/ps';
import { toId } from '@/utils/toId';

import type { Client } from 'ps-client';

const SCAVS_ROOMS = ['scavengers', 'treasuretown', 'groupchat-scavengers-partmantesting', 'groupchat-scavengers-test'];

type HuntType = 'regular' | 'official' | 'practice' | 'recycled' | 'unrated' | 'mini';

const HUNT_START_PATTERN =
	// eslint-disable-next-line max-len -- Regular Expression
	/^<div class="broadcast-blue"><strong>A new (?<type>regular|official|practice|recycled|unrated|mini) scavenger hunt by <em>(?<maker>.*)<\/em> has been started(?<qcer>(?: by <em>(.*)<\/em>)?)\.<\/strong><div style="[^"]*"><strong><em>Hint #1:<\/em> .*<\/strong><\/div>\(To answer, use <kbd>\/scavenge <em>ANSWER<\/em><\/kbd>\)<\/div>$/;
const HUNT_END_PATTERN =
	// eslint-disable-next-line max-len -- Regular Expression
	/^<div class="broadcast-blue"><strong>The (?<type>regular|official|practice|recycled|unrated|mini) scavenger hunt by <em>(?<maker>.*)<\/em> was ended/;

function isStaff(userString: string): boolean {
	return /^[%@*#]/.test(userString);
}

export function checkHunts(room: string, data: string) {
	if (!SCAVS_ROOMS.includes(room)) return;
	if (!IS_ENABLED.DISCORD) return;
	const huntChannel = getChannel(HUNT_ANNOUNCEMENTS_CHANNEL);
	if (!huntChannel) return;
	const isMainRoom = room === 'scavengers';
	if (!isMainRoom) return; // Temporarily disabling for Treasure Town
	const huntStart = data.match(HUNT_START_PATTERN) as {
		groups: {
			type: HuntType;
			maker: string;
			qcer?: string;
		};
	} | null;
	if (!huntStart) return;
	const { type: huntType, maker } = huntStart.groups;

	function post(message: string): void {
		const sanitized = unescapeHTML(message.replace(/(?<!^)@(?=here|everyone)/, '@\u200b'));
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

export function onEndHunt(this: Client, room: string, data: string) {
	if (!SCAVS_ROOMS.includes(room)) return;
	const isMainRoom = room === 'scavengers';

	const huntEnd = data.match(HUNT_END_PATTERN) as { groups: { type: HuntType } } | null;

	if (huntEnd) {
		// Hunt ended
		if (!isMainRoom) return;
		if (!isUGOActive()) return;

		let nonceCommand: ';addhunt' | ';addfishhunt' | ';addminifishhunt' | null = null;

		switch (huntEnd.groups.type) {
			case 'regular':
				nonceCommand = ';addhunt';
				break;
			case 'official':
				nonceCommand = ';addfishhunt';
				break;
			case 'mini':
				nonceCommand = ';addminifishhunt';
				break;
		}

		if (!nonceCommand) return;

		const nonceKey = createNonce(
			() => {
				this.addUser('UGO').send(nonceCommand);
			},
			// TODO: Perms should have an inbuilt way to check a specific room
			message => {
				const scavs = message.parent.getRoom(room);
				if (!scavs) return false;
				const roomUser = scavs.users.find(user => toId(user) === message.author.id);
				if (!roomUser) return false;
				return isStaff(roomUser);
			}
		);

		this.getRoom(room).sendHTML(
			<div>
				<Button value={`/botmsg ${this.status.username},${prefix}nonce ${nonceKey}`}>Add {huntEnd.groups.type} hunt to UGO</Button>
			</div>,
			{ rank: '%' }
		);
	}
}
