import { PSRoomConfigs as RoomConfigCache } from '@/cache';
import { fetchRoomConfigs } from '@/database/psrooms';

export async function loadRoomConfigs(): Promise<void> {
	const fetched = await fetchRoomConfigs();
	fetched.forEach(entry => {
		RoomConfigCache[entry.roomId] = entry;
	});
	log('Loaded PS room configs!');
}
