// The first versions can be imported directly; we'll update them via dynamic import calls.

import { autoResHandler } from '@/ps/handlers/autores';
import { commandHandler } from '@/ps/handlers/commands';
import { GROUPED_PERMS } from '@/ps/handlers/commands/customPerms';
import { parse } from '@/ps/handlers/commands/parse';
import { permissions } from '@/ps/handlers/commands/permissions';
import { spoof } from '@/ps/handlers/commands/spoof';
import { interfaceHandler } from '@/ps/handlers/interface';
import { joinHandler, leaveHandler, nickHandler } from '@/ps/handlers/joins';
import { pageHandler } from '@/ps/handlers/page';
import { rawHandler } from '@/ps/handlers/raw';

/**
 * Exports the 'live' versions of functions from Sentinel.
 *
 * Hotpatching will mutate the exposed object in `@/sentinel/live` wherever applicable.
 *
 * Note that some hotpatchable entries (eg: cron) will have entirely different logic.
 * Those cases will not need to be kept here.
 *
 * Top-level modules (eg: PS, Discord) will have their own data objects for convenience.
 */
export const LiveData = {};

/** @see {@link LiveData} */
export const LivePS = {
	autoResHandler,
	commands: {
		commandHandler,
		parse,
		permissions,
		spoof,
		GROUPED_PERMS,
	},
	interfaceHandler,
	joinHandler,
	leaveHandler,
	nickHandler,
	pageHandler,
	rawHandler,
};
