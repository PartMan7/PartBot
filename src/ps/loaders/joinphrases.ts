import { PSJoinphraseCache } from '@/cache';
import { fetchAllJoinphrases } from '@/database/joinphrases';
import { Logger } from '@/utils/logger';

export async function loadJoinphrases(): Promise<void> {
	const fetched = await fetchAllJoinphrases();
	fetched.forEach(entry => {
		const { id, phrase } = entry;
		PSJoinphraseCache[id] = { id, phrase };
	});
	Logger.log('Loaded Joinphrases!');
}
