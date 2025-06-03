import { LivePSHandlers } from '@/sentinel/live';
import { errorLog } from '@/utils/logger';

import type { Client } from 'ps-client';

export function registerEvent<Event extends keyof LivePSHandlers>(client: Client, event: Event): (typeof LivePSHandlers)[Event] {
	// @ts-expect-error -- TS doesn't like this, but it will end up being checked when calling
	return (...args: Parameters<(typeof LivePSHandlers)[Event]>) => {
		try {
			// @ts-expect-error -- See above
			return LivePSHandlers[event].apply(client, args);
		} catch (err) {
			if (err instanceof Error) errorLog(err);
		}
	};
}
