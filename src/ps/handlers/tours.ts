import { PSRoomConfigs } from '@/cache';
import { bulkAddPoints } from '@/database/points';
import getSecretFunction from '@/secrets/functions';
import { errorLog } from '@/utils/logger';

import type { Client } from 'ps-client';

export function tourHandler(this: Client, roomId: string, line: string, isIntro?: boolean): void {
	if (isIntro) return;

	const [tourEventType] = line.lazySplit('|', 1);
	const room = this.getRoom(roomId);

	if (roomId === 'hindi') {
		if (!tourEventType) return;
		if (tourEventType === 'battlestart') {
			const tourData = line.lazySplit('|', 3);
			this.joinRoom(tourData[3]).then(() => this.getRoom(tourData[3]).send("G'luck!\n/part"));
		} else if (tourEventType === 'update') {
			try {
				const tourData = line.lazySplit('|', 1);
				const json = JSON.parse(tourData[1]);
				if (json.generator !== 'Single Elimination') return;
				if (!json.bracketData) return;
				if (json.bracketData.type !== 'tree') return;
				if (!json.bracketData.rootNode) return;
				if (json.bracketData.rootNode.state === 'inprogress') {
					room.send(`/wall Tour finals! <<${json.bracketData.rootNode.room}>>`);
				}
			} catch (e) {
				if (e instanceof Error) errorLog(e);
			}
		} else if (tourEventType === 'end') {
			try {
				const [_tourEventType, tourBracketTree] = line.lazySplit('|', 1);
				const json = JSON.parse(tourBracketTree);
				if (/casual|ignore|no ?points/i.test(json.format || '')) return;

				// The actual algorithm is secret
				// Nice try, though
				const scoringAlgo = getSecretFunction<(tourBracket: string) => Record<string, number> | null>(
					'hindiTourPointsAlgo',
					() => null
				);
				const pointsToAdd = scoringAlgo(tourBracketTree);

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
			} catch (e) {
				if (e instanceof Error) errorLog(e);
			}
		}
	}
}
