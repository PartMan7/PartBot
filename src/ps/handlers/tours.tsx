import { Temporal } from '@js-temporal/polyfill';

import { PSPointsNonce, PSRoomConfigs } from '@/cache';
import { prefix } from '@/config/ps';
import { bulkAddPoints } from '@/database/points';
import { ANNOUNCEMENTS_CHANNEL, ROLES } from '@/discord/constants/servers/petmods';
import { getChannel } from '@/discord/loaders/channels';
import { IS_ENABLED } from '@/enabled';
import { TimeZone } from '@/ps/handlers/cron/constants';
import getSecretFunction from '@/secrets/functions';
import { Form } from '@/utils/components/ps';
import { errorLog } from '@/utils/logger';
import { randomString } from '@/utils/random';

import type { Client } from 'ps-client';

export type BracketNode = {
	team: string;
	children?: [BracketNode, BracketNode] | null;
} & (
	| {
			state: 'finished';
			result: 'win';
			score: [1, 0] | [0, 1];
	  }
	| {
			state: 'inprogress';
			room: string;
	  }
	| {
			state: 'available' | 'unavailable' | 'challenging';
	  }
);

export type BracketTree = {
	format: string;
	generator: string;
	bracketData: {
		type: 'tree';
		rootNode: BracketNode;
	};
};

// TODO: Maybe move this to utils
function inRange(time: Temporal.PlainTime, range: [Temporal.PlainTime, Temporal.PlainTime]): boolean {
	const rangeCompare = Temporal.PlainTime.compare(...range);
	if (rangeCompare === 0) return Temporal.PlainTime.compare(time, range[0]) === 0;

	const insideRange = rangeCompare === -1;
	if (insideRange) {
		return Temporal.PlainTime.compare(time, range[0]) === 1 && Temporal.PlainTime.compare(time, range[1]) === -1;
	} else {
		return Temporal.PlainTime.compare(time, range[0]) === -1 && Temporal.PlainTime.compare(time, range[1]) === 1;
	}
}
export function tourHandler(this: Client, roomId: string, line: string, isIntro?: boolean): void {
	if (isIntro) return;

	const [event, data] = line.lazySplit('|', 1) as ['battlestart' | 'update' | 'end' | string, string];
	if (!event) return;

	const room = this.getRoom(roomId);

	const wishLuck = ['hindi', 'capproject'].includes(roomId);
	const wallTourFinals = ['hindi', 'capproject'].includes(roomId);

	switch (event) {
		case 'create': {
			const [_format, generator, _, name] = data.lazySplit('|', 3);
			if (IS_ENABLED.DB && roomId === 'petmods') {
				getChannel(ANNOUNCEMENTS_CHANNEL)?.send(`${ROLES.PS_TOURS} A ${name} ${generator} tournament has been created in the room!`);
			}
			break;
		}
		case 'battlestart': {
			if (wishLuck) {
				const [_p1, _p2, battleRoom] = data.lazySplit('|', 2);
				this.joinRoom(battleRoom).then(() => this.getRoom(battleRoom).send("G'luck!\n/part"));
			}
			break;
		}
		case 'update': {
			// TODO: PS no longer sends generator in update events! Might need to store stuff in state
			if (wallTourFinals) {
				let json: BracketTree;
				try {
					json = JSON.parse(data);
				} catch (e) {
					if (e instanceof Error) errorLog(e);
					return;
				}
				if (json.generator !== 'Single Elimination') return;
				if (!json.bracketData) return;
				if (json.bracketData.type !== 'tree') return;
				if (!json.bracketData.rootNode) return;
				if (json.bracketData.rootNode.state === 'inprogress') {
					room.send(`/wall Tour finals! <<${json.bracketData.rootNode.room}>>`);
				}
			}
			break;
		}
		case 'end': {
			let json: BracketTree;
			try {
				json = JSON.parse(data);
			} catch (e) {
				if (e instanceof Error) errorLog(e);
				return;
			}
			if (roomId === 'hindi') {
				if (/casual|ignore|no ?points/i.test(json.format || '')) return;
				// The actual algorithm is secret
				// Nice try, though
				const scoringAlgo = getSecretFunction<(tourBracket: string) => Record<string, number> | null>(
					'hindiTourPointsAlgo',
					() => null
				);
				const pointsToAdd = scoringAlgo(data);
				if (!pointsToAdd) return;

				const pointsType = PSRoomConfigs[roomId]?.points?.priority[0];
				if (!pointsType) throw new Error(`AAAAAA someone ping PartMan for ${roomId}`);
				bulkAddPoints(
					Object.fromEntries(
						Object.entries(pointsToAdd).map(([user, points]) => [user, { id: user, points: { [pointsType]: points } }])
					),
					roomId
				).then(() => {
					// TODO: Run leaderboard
				});
			}
			if (roomId === 'capproject') {
				const currentTime = Temporal.Now.instant().toZonedDateTimeISO(TimeZone.AST).toPlainTime();

				if (
					inRange(currentTime, [new Temporal.PlainTime(11), new Temporal.PlainTime(13)]) ||
					inRange(currentTime, [new Temporal.PlainTime(23), new Temporal.PlainTime(1)])
				) {
					if (json.generator !== 'Single Elimination') return;

					const root = json.bracketData.rootNode;
					const winners: string[] = [];
					const pointsToAdd: Record<string, number> = {};

					// add first place
					winners.push(root.team);
					// add second place
					root.children?.forEach(child => {
						if (child.team !== winners[0]) winners.push(child.team);
					});
					// add runners-up
					root.children?.forEach(child => {
						if (Array.isArray(child.children))
							child.children.forEach(kid => {
								if (!winners.includes(kid.team)) winners.push(kid.team);
							});
					});

					[3, 2, 1, 1].forEach((amt, index) => {
						if (winners[index]) {
							pointsToAdd[winners[index]] = amt;
						}
					});

					const pointsType = PSRoomConfigs.capproject?.points?.types.tournight;
					if (!pointsType) {
						room.send("Hi for some reason Tour Nights don't exist, someone go poke PartMan");
						errorLog(new Error(`CAP room points: ${JSON.stringify(PSRoomConfigs.capproject)}`));
						return;
					}

					const nonce = randomString();
					// TODO: Add mapValues
					PSPointsNonce[nonce] = Object.fromEntries(
						Object.entries(pointsToAdd).map(([user, amount]) => [user, { [pointsType.id]: amount }])
					);

					room.sendHTML(
						<div className="infobox">
							<p>
								<b>{pointsType.plural}</b>
								{': '}
								{Object.entries(pointsToAdd)
									.map(([user, amount]) => `+${amount} ${user}`)
									.join(', ')}
							</p>
							<p>
								<Form value={`/botmsg ${this.status.username},${prefix}@${roomId} addnonce ${nonce}`}>
									<button>Add Points!</button>
								</Form>
							</p>
						</div>,
						{ rank: '%' }
					);
				}
			}
		}
	}
}
