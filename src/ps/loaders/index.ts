import { loadAlts } from '@/ps/loaders/alts';
import { loadCommands } from '@/ps/loaders/commands';
import { loadRoomConfigs } from '@/ps/loaders/roomconfigs';

export default async function init() {
	await loadCommands();
	await loadAlts();
	await loadRoomConfigs();
}
