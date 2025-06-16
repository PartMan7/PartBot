import { prefix } from '@/config/ps';
import { toId } from '@/tools';

import type { PSMessage } from '@/types/ps';

const HELP_MESSAGE = `I'm a bot by PartMan. Please try \`\`${prefix}help\`\` for more info!`;

export function autoResHandler(message: PSMessage) {
	if (message.isIntro) return;
	if (!message.author.userid || !message.target) return;
	if (toId(message.content) === message.parent.status.userid && message.content.endsWith('?')) {
		return message.author.send(`Hi, I'm ${message.parent.status.username}! ${HELP_MESSAGE}`);
	}
	if (message.author.id === 'dhelmise' && message.content.trim().toLowerCase() === 'fartbot?') {
		return message.reply(`I'm FartBot! ${HELP_MESSAGE}.\nAlso, you need a shower.`);
	}
}
