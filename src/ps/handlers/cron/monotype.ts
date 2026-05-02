import { EmbedBuilder } from 'discord.js';
import { uploadToPastie } from 'ps-client/tools';

import { PSRoomConfigs } from '@/cache';
import { queryPoints, resetPoints } from '@/database/points';
import { TimeZone } from '@/ps/handlers/cron/constants';
import { hasPoints } from '@/ps/handlers/cron/utils';
import getSecretFunction from '@/secrets/functions';
import { Logger } from '@/utils/logger';

import type { PSCronJobManager } from '@/ps/handlers/cron/index';
import type { WebhookClient } from 'discord.js';
import type { Client } from 'ps-client';

const ROOM_ID = 'monotype';
const webhook = getSecretFunction('getMonoWebhook', (): WebhookClient | null => null)();

export function register(this: Client, Jobs: PSCronJobManager): void {
	// Midnight on the 1st of every month
	Jobs.register('mono-monthly-lb-reset', '0 0 1 * *', TimeZone.GMT, async () => {
		const room = this.getRoom(ROOM_ID);
		if (!room) return;

		const roomConfig = PSRoomConfigs[ROOM_ID]?.points;
		if (!roomConfig) return;

		const leaderboard = await queryPoints(ROOM_ID, roomConfig.priority, Infinity);
		if (!leaderboard?.length) return;

		const topFiveScore = roomConfig.priority.map(type => leaderboard[2].points[type]);
		const hasSomePoints = topFiveScore.some(v => v > 0);
		if (!hasSomePoints) return;

		const topUsers = leaderboard.filter(user =>
			hasPoints(
				roomConfig.priority.map(type => user.points[type]),
				topFiveScore
			)
		);

		room.send(`/wall Congratulations to ${topUsers.map(u => u.name).list()} for topping this month's leaderboard!`);

		const backupURL = await uploadToPastie(JSON.stringify(leaderboard, null, 2));
		Logger.log(`Monthly leaderboard backup for ${ROOM_ID}: ${backupURL}`);
		room.send(`/modnote Monthly leaderboard backup: ${backupURL}`);

		if (!webhook) return;
		const embed = new EmbedBuilder()
			.setColor('Purple')
			.setTitle('Monthly Leaderboard Reset')
			.addFields(
				{
					name: 'Top Users',
					value: topUsers.map(user => `${user.name} (${roomConfig.priority.map(type => user.points[type]).join(', ')})`).list(),
				},
				{ name: 'Monthly Leaderboard Backup', value: backupURL }
			);
		await webhook.send({ embeds: [embed] });

		await resetPoints(ROOM_ID, true);
	});
}
