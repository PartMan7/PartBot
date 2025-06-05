import { PSAltCache } from '@/cache';
import { fetchAllAlts } from '@/database/alts';
import { Logger } from '@/utils/logger';

export async function loadAlts(): Promise<void> {
	const fetched = await fetchAllAlts();
	fetched.forEach(entry => {
		const { id, from, to, at } = entry;
		PSAltCache[id] = { from, to, at };
	});
	Logger.log('Loaded alts!');
}
