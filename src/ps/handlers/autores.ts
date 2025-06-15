import { prefix } from '@/config/ps';
import { toId } from '@/tools';

import type { PSMessage } from '@/types/ps';

export function autoResHandler(message: PSMessage) {
	if (!message.author.userid || !message.target) return;
	if (toId(message.content) === message.parent.status.userid && message.content.endsWith('?'))
		message.author.send(
			`Hi, I'm ${message.parent.status.username}! I'm a bot by PartMan. Please try \`\`${prefix}help\`\` for more info!`
		);
}
