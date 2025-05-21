import connection from '@/database';
import { IS_ENABLED } from '@/enabled';
import { loadAlts } from '@/ps/loaders/alts';
import { loadCommands } from '@/ps/loaders/commands';
import { loadRoomConfigs } from '@/ps/loaders/roomconfigs';
import { loadSeens } from '@/ps/loaders/seens';

export default async function init() {
	await connection;
	await loadCommands();
	if (IS_ENABLED.DB) {
		await loadAlts();
		await loadSeens();
		await loadRoomConfigs();
	}
}
