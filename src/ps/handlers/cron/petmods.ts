import { uploadToPastie } from 'ps-client/tools';

import { PSRoomConfigs } from '@/cache';
import { queryPoints, resetPoints } from '@/database/points';
import { TimeZone } from '@/ps/handlers/cron/constants';
import { Logger } from '@/utils/logger';

import type { PSCronJobManager } from '@/ps/handlers/cron/index';
import type { Client } from 'ps-client';

const ROOM_ID = 'petmods';

export function register(this: Client, Jobs: PSCronJobManager): void {
	// Midnight on the 1st of every month
	Jobs.register('petmods-monthly-lb-reset', '0 0 1 * *', TimeZone.GMT, async () => {
		const room = this.getRoom(ROOM_ID);
		if (!room) return;

		const roomConfig = PSRoomConfigs[ROOM_ID]?.points;
		if (!roomConfig) return;

		const leaderboard = await queryPoints(ROOM_ID, roomConfig.priority, Infinity);
		if (!leaderboard?.length) return;

		const topScore = roomConfig.priority.map(type => leaderboard[0].points[type]);
		const hasPoints = topScore.some(v => v > 0);
		if (!hasPoints) return;

		const topUsers = leaderboard.filter(user =>
			roomConfig.priority.every((type, i) => user.points[type] === topScore[i])
		);

		room.send(`/wall Congratulations to ${topUsers.map(u => u.name).list()} for topping this month's leaderboard!`);

		const backupURL = await uploadToPastie(JSON.stringify(leaderboard, null, 2));
		Logger.log(`Monthly leaderboard backup for ${ROOM_ID}: ${backupURL}`);
		room.send(`/modnote Monthly leaderboard backup: ${backupURL}`);

		await resetPoints(ROOM_ID, true);
	});
}
