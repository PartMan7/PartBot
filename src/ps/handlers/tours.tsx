import { PSCommands, PSPointsNonce, PSRoomConfigs } from '@/cache';
import { prefix } from '@/config/ps';
import { type BulkPointsDataInput, bulkAddPoints } from '@/database/points';
import { ANNOUNCEMENTS_CHANNEL, ROLES } from '@/discord/constants/servers/petmods';
import { getChannel } from '@/discord/loaders/channels';
import { IS_ENABLED } from '@/enabled';
import { i18n } from '@/i18n';
import { getLanguage } from '@/i18n/language';
import getSecretFunction from '@/secrets/functions';
import { Username } from '@/utils/components';
import { Form } from '@/utils/components/ps';
import { Logger } from '@/utils/logger';
import { mapValues } from '@/utils/map';
import { pluralize } from '@/utils/pluralize';
import { randomString } from '@/utils/random';
import { toId } from '@/utils/toId';

import type { TranslatedText } from '@/i18n/types';
import type { PSCommandContext } from '@/types/chat';
import type { RecursivePartial } from '@/types/common';
import type { PSMessage } from '@/types/ps';
import type { Client } from 'ps-client';

export type BracketNode = {
	team?: string;
	children?: BracketNode[] | null;
} & (
	| {
			state: 'finished';
			result: 'win' | 'loss';
			score: [number, number];
	  }
	| {
			state: 'inprogress';
			room: string;
	  }
	| {
			state: 'available' | 'unavailable' | 'challenging';
	  }
	| {
			state?: undefined;
	  }
);

export type BracketTree = {
	format: string;
	generator: string;
	results?: string[][];
	bracketData?: {
		type: 'tree';
		rootNode: BracketNode;
	};
};

function isFinishedMatchNode(
	node: BracketNode | undefined | null
): node is BracketNode & { state: 'finished'; result: 'win' | 'loss' } {
	return !!node && node.state === 'finished' && (node.result === 'win' || node.result === 'loss');
}

function getSubtreeChampion(node: BracketNode | undefined | null): string | null {
	if (!node) return null;
	if (isFinishedMatchNode(node)) return node.team ?? null;
	if (!node.children?.length) return node.team ?? null;
	return getSubtreeChampion(node.children[0]) ?? getSubtreeChampion(node.children[1]) ?? node.team ?? null;
}

function getMatchLoser(node: BracketNode | undefined | null): string | null {
	if (!isFinishedMatchNode(node) || !node.children || node.children.length !== 2) return null;
	return getSubtreeChampion(node.children[node.result === 'loss' ? 0 : 1]);
}

/** Placements for single-elim tree: champion, runner-up, two semifinal losers (order preserved). */
export function getTopFourFromBracketTree(json: BracketTree): string[] {
	const root = json.bracketData?.rootNode;
	if (!root) return [];

	const out: string[] = [];
	const pushUnique = (name: string | null) => {
		if (!name) return;
		const id = toId(name);
		if (!out.some(n => toId(n) === id)) out.push(name);
	};

	pushUnique(getSubtreeChampion(root));
	pushUnique(getMatchLoser(root));

	if (root.children) {
		for (const child of root.children) {
			pushUnique(getMatchLoser(child));
		}
	}

	return out.slice(0, 4);
}

function labelPoints(data: Record<string, number>, pointsType: string): Record<string, Record<string, number>> {
	return mapValues(data, amount => ({ [pointsType]: amount }));
}

function toBulkData(data: Record<string, Record<string, number>>): BulkPointsDataInput {
	return mapValues(data, (points, user) => ({ id: toId(user), name: user, points }));
}

export function tourHandler(this: Client, roomId: string, line: string, isIntro?: boolean): void {
	if (isIntro) return;

	const [event, data] = line.lazySplit('|', 1) as ['battlestart' | 'update' | 'end' | string, string];
	if (!event) return;

	const room = this.getRoom(roomId);
	const $T = i18n(getLanguage(room));

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
			const roomConfig = PSRoomConfigs[roomId];
			if (roomConfig?.tour?.timer) {
				const [autostart, autoDQ] = roomConfig.tour.timer;
				room.send(`/tour autostart ${autostart}\n/tour autodq ${autoDQ}`);
			}
			break;
		}
		case 'battlestart': {
			if (wishLuck) {
				const [_p1, _p2, battleRoom] = data.lazySplit('|', 2);
				this.joinRoom(battleRoom).then(() => this.getRoom(battleRoom).send(`${$T('GOOD_LUCK')}\n/part` as TranslatedText));
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
				const $T = i18n(getLanguage(room));
				const partialContext: Partial<PSCommandContext> = {
					args: [],
					message: partialMessage as PSMessage,
					broadcastHTML: room.sendHTML.bind(room),
					$T,
				};
				lbCommand.run(partialContext as PSCommandContext);
			};

			switch (roomId) {
				case 'hindi': {
					if (/casual|ignore|no ?points/i.test(json.format || '')) return;
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
					if (json.generator !== 'Single Elimination') return;

					const winners = getTopFourFromBracketTree(json);
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
									<button type="submit">Add Points!</button>
								</Form>
							</p>
						</div>,
						{ rank: '%' }
					);
					break;
				}

				case 'petmods': {
					const winners = getTopFourFromBracketTree(json);
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
