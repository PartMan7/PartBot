import { CronJob } from 'cron';

import { PSCronJobs } from '@/cache';

import type { Client } from 'ps-client';

// Timezones
/** @see https://en.wikipedia.org/wiki/List_of_tz_database_time_zones */
enum TimeZone {
	IST = 'Asia/Kolkata',
	GMT = 'Etc/GMT',
}

export class PSCronJobManager {
	readonly #jobs: Record<string, CronJob> = {};

	register(id: string, cronTime: string, timeZone: TimeZone, callback: () => void): void {
		this.#jobs[id] = CronJob.from({ name: id, cronTime, start: true, onTick: callback, timeZone });
	}
	kill(): void {
		for (const jobId in this.#jobs) {
			this.#jobs[jobId].stop();
		}
	}
}

export function startPSCron(client: Client): PSCronJobManager {
	const Jobs = new PSCronJobManager();

	// TODO Move back to Hindi and remove 'CRON:'
	Jobs.register('hindi-automodchat-enable', '0 0 * * *', TimeZone.IST, () => {
		client.rooms.get('botdevelopment')?.send('CRON: /automodchat 10, +');
	});
	Jobs.register('hindi-automodchat-disable', '0 7 * * *', TimeZone.IST, () => {
		const room = client.rooms.get('botdevelopment');
		room?.send('CRON: /modchat ac');
		room?.send('CRON: /automodchat off');
	});

	// Kill existing cron jobs
	PSCronJobs.manager?.kill();
	PSCronJobs.manager = Jobs;

	return Jobs;
}
