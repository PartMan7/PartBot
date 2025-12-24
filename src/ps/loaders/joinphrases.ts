import { PSJoinphraseCache } from '@/cache';
import { fetchAllJoinphrases } from '@/database/joinphrases';
import { emptyObject } from '@/utils/emptyObject';
import { Logger } from '@/utils/logger';

export async function loadJoinphrases(): Promise<void> {
	emptyObject(PSJoinphraseCache);
	const fetched = await fetchAllJoinphrases(null);

	fetched.forEach(({ id, phrase, userId, username, roomId }) => {
		(PSJoinphraseCache[roomId] ??= {})[userId] = { id, phrase, username, messageCount: Infinity, lastTime: 0 };
	});
	Logger.log('Loaded joinphrases!');
}
