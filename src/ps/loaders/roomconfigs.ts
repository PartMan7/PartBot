import { PSRoomConfigs } from '@/cache';
import { fetchRoomConfigs } from '@/database/psrooms';
import { log } from '@/utils/logger';

export async function loadRoomConfigs(): Promise<void> {
	const fetched = await fetchRoomConfigs();
	fetched.forEach(entry => {
		PSRoomConfigs[entry.roomId] = entry;
	});
	log('Loaded PS room configs!');
}
