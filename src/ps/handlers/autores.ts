import type { Message } from 'ps-client';

export default function autoResHandler (message: Message) {
	if (!message.author.userid || !message.target) return;
}
