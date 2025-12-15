import { PSJoinphraseCache } from '@/cache';
import { fetchAllJoinphrases } from '@/database/joinphrases';
import { Logger } from '@/utils/logger';

export async function loadJoinphrases(): Promise<void> {
	const fetched = await fetchAllJoinphrases(null);
	fetched.forEach(entry => {
		const { id, phrase, userId, username, roomId } = entry;
		(PSJoinphraseCache[roomId] ??= {})[userId] = { id, phrase, username, messageCount: Infinity, lastTime: 0 };
	});
	Logger.log('Loaded Joinphrases!');
}
