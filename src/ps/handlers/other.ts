import { PSJoinphraseCache, PSRoomConfigs } from '@/cache';
import { isPSQuoteAddMessage, syncRoomQuotes } from '@/ps/handlers/quoteSync';
import { Logger } from '@/utils/logger';

import type { PSMessage } from '@/types/ps';

export function otherHandler(message: PSMessage) {
	if (message.isIntro) return;
	if (!message.author || !message.author.userid || !message.target || message.type !== 'chat') return;
	if (PSRoomConfigs[message.target.id]?.quoteSync && isPSQuoteAddMessage(message.content)) {
		syncRoomQuotes(message.parent, message.target.id).catch(err =>
			Logger.errorLog(err instanceof Error ? err : new Error(String(err)))
		);
	}
	if (message.author.id === message.parent.status.userid) return;
	if (message.content.startsWith('|')) return;

	// Get the joinphrase data for this room
	const roomJPData = PSJoinphraseCache[message.target.id];
	if (roomJPData) {
		// Increment message count for each joinphrase in this room
		for (const userId in roomJPData) {
			const joinphraseData = roomJPData[userId];
			if (joinphraseData) joinphraseData.messageCount++;
		}
	}
}
