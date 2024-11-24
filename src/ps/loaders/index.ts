import connection from '@/database';
import { loadAlts } from '@/ps/loaders/alts';
import { loadCommands } from '@/ps/loaders/commands';
import { loadRoomConfigs } from '@/ps/loaders/roomconfigs';

export default async function init() {
	await connection;
	await loadCommands();
	await loadAlts();
	await loadRoomConfigs();
}
