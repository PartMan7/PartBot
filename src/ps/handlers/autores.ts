import type { Message, User } from 'types/ps';

export default function autoResHandler (message: Message) {
	if (!message.author.userid || !message.target) return;
}
