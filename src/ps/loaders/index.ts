import connection from '@/database';
import { IS_ENABLED } from '@/enabled';
import { loadCommands } from '@/ps/loaders/commands';
import { loadJoinphrases } from '@/ps/loaders/joinphrases';
import { loadRoomConfigs } from '@/ps/loaders/roomconfigs';
import { loadRepeats } from '@/ps/repeats';

import type { Client } from 'ps-client';

export default async function init(PS: Client) {
	await connection;
	await loadCommands();
	if (IS_ENABLED.DB) {
		await loadJoinphrases();
		await loadRoomConfigs();
		await loadRepeats(PS);
	}
}
