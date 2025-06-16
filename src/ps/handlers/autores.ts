import { PSNoPrefixHelp } from '@/cache';
import { owner, prefix, username } from '@/config/ps';
import { fromHumanTime, toId } from '@/tools';

import type { PSMessage } from '@/types/ps';

export function autoResHandler(message: PSMessage) {
	if (message.isIntro) return;
	if (!message.author.userid || !message.target || message.author.id === message.parent.status.userid) return;

	const helpMessage = `Hi, I'm ${username}, a chatbot by ${owner}! My prefix is \`\`${prefix}\`\` - try \`\`${prefix}help\`\` or \`\`${prefix}commands!\`\``;
	if (toId(message.content) === message.parent.status.userid && message.content.endsWith('?')) {
		return message.author.send(helpMessage);
	}
	if (message.author.id === 'dhelmise' && message.content.trim().toLowerCase() === 'fartbot?') {
		return message.reply(`${helpMessage}\nAlso, ${message.author.name} needs a shower.`);
	}

	/* Standard bot reply */
	// Only reply if the message didn't start from the prefix...
	if (!message.content.startsWith(prefix)) {
		const { userid } = message.author;
		// Don't send the help message if sent in the last 5 minutes
		if (Date.now() - (PSNoPrefixHelp[userid]?.getTime() ?? 0) < fromHumanTime('5 minutes')) return;
		PSNoPrefixHelp[userid] = new Date();
		return message.reply(helpMessage);
	}
}
