import type { PSMessage } from '@/types/ps';

export function autoResHandler(message: PSMessage) {
	if (!message.author.userid || !message.target) return;
}
