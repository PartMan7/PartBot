import { Temporal } from '@js-temporal/polyfill';

import { PSCommands, PSPointsNonce, PSRoomConfigs } from '@/cache';
import { prefix } from '@/config/ps';
import { type BulkPointsDataInput, bulkAddPoints } from '@/database/points';
import { ANNOUNCEMENTS_CHANNEL, ROLES } from '@/discord/constants/servers/petmods';
import { getChannel } from '@/discord/loaders/channels';
import { IS_ENABLED } from '@/enabled';
import { i18n } from '@/i18n';
import { TimeZone } from '@/ps/handlers/cron/constants';
import getSecretFunction from '@/secrets/functions';
import { toId } from '@/tools';
import { Username } from '@/utils/components';
import { Form } from '@/utils/components/ps';
import { Logger } from '@/utils/logger';
import { pluralize } from '@/utils/pluralize';
import { randomString } from '@/utils/random';

import type { PSCommandContext } from '@/types/chat';
import type { RecursivePartial } from '@/types/common';
import type { PSMessage } from '@/types/ps';
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

function labelPoints(data: Record<string, number>, pointsType: string): Record<string, Record<string, number>> {
	// TODO: Add mapValues
	return Object.fromEntries(Object.entries(data).map(([user, amount]) => [user, { [pointsType]: amount }]));
}

function toBulkData(data: Record<string, Record<string, number>>): BulkPointsDataInput {
	return Object.fromEntries(Object.entries(data).map(([user, points]) => [user, { id: toId(user), name: user, points }]));
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
			const [_format, _generator, _, name] = data.lazySplit('|', 3);
			if (IS_ENABLED.DISCORD && roomId === 'petmods') {
				getChannel(ANNOUNCEMENTS_CHANNEL)?.send(
					`${ROLES.PS_TOURS} A ${name} tournament has been created in [the room](https://play.pokemonshowdown.com/petmods)!`
				);
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
					if (e instanceof Error) Logger.errorLog(e);
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
				if (e instanceof Error) Logger.errorLog(e);
				return;
			}

			const showLeaderboard = () => {
				const lbCommand = PSCommands.leaderboard;
				const partialMessage: RecursivePartial<PSMessage> = {
					type: 'chat',
					target: room,
					parent: this,
				};
				const $T = i18n(); // TODO: Use language pref
				const partialContext: Partial<PSCommandContext> = {
					args: [],
					message: partialMessage as PSMessage,
					broadcastHTML: room.sendHTML.bind(room),
					$T,
				};
				lbCommand.run(partialContext as PSCommandContext);
			};

			/** [#1, #2, #3 and #4] */
			const getTopFour = (): string[] => {
				const winners: string[] = [];
				const root = json.bracketData.rootNode;

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

				return winners;
			};

			switch (roomId) {
				case 'hindi': {
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
					bulkAddPoints(toBulkData(labelPoints(pointsToAdd, pointsType)), roomId).then(res => {
						if (res) showLeaderboard();
					});
					break;
				}

				case 'capproject': {
					const currentTime = Temporal.Now.instant().toZonedDateTimeISO(TimeZone.AST).toPlainTime();

					if (
						inRange(currentTime, [new Temporal.PlainTime(11), new Temporal.PlainTime(13)]) ||
						inRange(currentTime, [new Temporal.PlainTime(23), new Temporal.PlainTime(1)])
					) {
						if (json.generator !== 'Single Elimination') return;

						const winners = getTopFour();
						const pointsToAdd: Record<string, number> = {};

						[3, 2, 1, 1].forEach((amt, index) => {
							if (winners[index]) {
								pointsToAdd[winners[index]] = amt;
							}
						});

						const pointsType = PSRoomConfigs[roomId]?.points?.types.tournight;
						if (!pointsType) {
							room.send("Hi for some reason Tour Nights don't exist, someone go poke PartMan");
							Logger.errorLog(new Error(`CAP room points: ${JSON.stringify(PSRoomConfigs[roomId])}`));
							return;
						}

						const nonce = randomString();
						PSPointsNonce[nonce] = labelPoints(pointsToAdd, pointsType.id);

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
					break;
				}

				case 'petmods': {
					const winners = getTopFour();
					if (winners.length < 4) {
						room.sendHTML(<div className="infobox">Not adding points for this (only {winners.length} players).</div>, { rank: '%' });
						return;
					}

					const roomConfig = PSRoomConfigs[roomId]?.points;
					const pointsType = roomConfig?.types[roomConfig?.priority[0]];
					if (!pointsType) {
						room.send("Hi for some reason points aren't configured properly, someone go poke PartMan");
						Logger.errorLog(new Error(`Pet Mods room points: ${JSON.stringify(PSRoomConfigs[roomId])}`));
						return;
					}

					const pointsToAdd: Record<string, number> = {};
					[4, 2, 1, 1].forEach((amount, index) => (pointsToAdd[winners[index]] = amount));

					bulkAddPoints(toBulkData(labelPoints(pointsToAdd, pointsType.id)), roomId).then(res => {
						if (!res) return;
						room.sendHTML(
							<div className="infobox">
								Added points:{' '}
								{Object.entries(pointsToAdd).map(([user, amount]) => (
									<>
										<Username name={user} />: {pluralize(amount, pointsType)}
									</>
								))}
							</div>,
							{
								rank: '%',
							}
						);
						showLeaderboard();
					});
					break;
				}
			}
		}
	}
}
