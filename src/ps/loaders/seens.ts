import { fetchAllAlts } from '@/database/alts';
import { PSAltCache } from '@/cache';

export async function loadAlts (): Promise<void> {
	const fetched = await fetchAllAlts();
	fetched.forEach(entry => {
		const { id, from, to, at } = entry;
		PSAltCache[id] = { from, to, at };
	});
	log('Loaded alts!');
}
