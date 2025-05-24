// Exports the 'live' versions of functions from Sentinel.
// Hotpatching will mutate the exposed object here wherever applicable.

// Note that some hotpatchable entries (eg: cron) will have entirely different logic.
// Those cases will not need to be kept here.

// The first versions can be imported directly; we'll update them via dynamic import calls.

import { autoResHandler } from '@/ps/handlers/autores';
import { commandHandler } from '@/ps/handlers/commands';
import { interfaceHandler } from '@/ps/handlers/interface';
import { joinHandler, leaveHandler, nickHandler } from '@/ps/handlers/joins';
import { pageHandler } from '@/ps/handlers/page';
import { rawHandler } from '@/ps/handlers/raw';

export const LivePS = {
	autoResHandler,
	commandHandler,
	interfaceHandler,
	joinHandler,
	leaveHandler,
	nickHandler,
	pageHandler,
	rawHandler,
};
