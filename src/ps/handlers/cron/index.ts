import { CronJob } from 'cron';

import { PSCronJobs } from '@/cache';
import { register } from '@/ps/handlers/cron/hindi';

import type { TimeZone } from '@/ps/handlers/cron/constants';
import type { Client } from 'ps-client';

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

export function startPSCron(this: Client): PSCronJobManager {
	const Jobs = new PSCronJobManager();
	register.call(this, Jobs);

	// Kill existing cron jobs
	PSCronJobs.manager?.kill();
	PSCronJobs.manager = Jobs;

	return Jobs;
}
