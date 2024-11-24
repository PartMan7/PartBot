import { PSAltCache } from '@/cache';
import { fetchAllAlts } from '@/database/alts';

export async function loadAlts(): Promise<void> {
	const fetched = await fetchAllAlts();
	fetched.forEach(entry => {
		const { id, from, to, at } = entry;
		PSAltCache[id] = { from, to, at };
	});
	log('Loaded alts!');
}
