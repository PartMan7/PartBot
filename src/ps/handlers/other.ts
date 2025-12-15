import { PSJoinphraseCache } from '@/cache';

import type { PSMessage } from '@/types/ps';

export function otherHandler(message: PSMessage) {
	if (message.isIntro) return;
	if (
		!message.author ||
		!message.author.userid ||
		!message.target ||
		message.author.id === message.parent.status.userid ||
		message.type !== 'chat'
	)
		return;
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
