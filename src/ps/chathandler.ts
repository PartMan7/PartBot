import type { Message, User, Room } from 'types/ps';

import { prefix } from 'config/ps';

export default function chatHandler (message: Message) {
	if (message.isIntro) return;
	if (!message.content.startsWith(prefix)) return;
	const args = message.content.substring(prefix.length).split(/ +/);
}
