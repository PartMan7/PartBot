import { PSSeenCache } from '@/cache';
import { fetchAllSeens } from '@/database/seens';
import { log } from '@/utils/logger';

export async function loadSeens(): Promise<void> {
	const fetched = await fetchAllSeens();
	fetched.forEach(entry => {
		const { id, name, at, seenIn } = entry;
		PSSeenCache[id] = { id, name, at, seenIn };
	});
	log('Loaded alts!');
}
