import { CronJob } from 'cron';

import type { Client } from 'ps-client';

// Timezones
/** @see https://en.wikipedia.org/wiki/List_of_tz_database_time_zones */
enum TimeZone {
	IST = 'Asia/Kolkata',
	GMT = 'Etc/GMT',
}

class PSCronJobManager {
	client: Client;
	readonly #jobs: Record<string, CronJob> = {};

	constructor(client: Client) {
		this.client = client;
	}

	register(id: string, cronTime: string, timeZone: TimeZone, callback: () => void): void {
		this.#jobs[id] = CronJob.from({ name: id, cronTime, onTick: callback, timeZone });
	}
	kill(): void {
		for (const jobId in this.#jobs) {
			this.#jobs[jobId].stop();
		}
	}
}

export function startCron(client: Client): PSCronJobManager {
	const Jobs = new PSCronJobManager(client);

	// TODO Move back to Hindi and remove 'CRON:'
	Jobs.register('hindi-automodchat-enable', '0 0 * * *', TimeZone.IST, () => {
		client.rooms.get('botdevelopment')?.send('CRON: /automodchat 10, +');
	});
	Jobs.register('hindi-automodchat-disable', '0 7 * * *', TimeZone.IST, () => {
		const room = client.rooms.get('botdevelopment');
		room?.send('CRON: /modchat ac');
		room?.send('CRON: /automodchat off');
	});

	return Jobs;
}
