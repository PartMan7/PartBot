import { PSNoPrefixHelp } from '@/cache';
import { owner, prefix, username } from '@/config/ps';
import { fromHumanTime } from '@/utils/humanTime';
import { sample } from '@/utils/random';
import { toId } from '@/utils/toId';

import type { PSMessage } from '@/types/ps';

export function autoResHandler(message: PSMessage) {
	if (message.isIntro) return;
	if (!message.author || !message.author.userid || !message.target || message.author.id === message.parent.status.userid) return;
	if (message.content.startsWith('|')) return; // Exclude PS stuff like `|closepage|` and `|requestpage|`

	if (message.awaited) return; // Don't do this if the user submitted a valid prompt response

	const helpMessage = `Hi, I'm ${username}, a chatbot by ${owner}! My prefix is \`\`${prefix}\`\` - try \`\`${prefix}help\`\` or \`\`${prefix}commands!\`\``;
	if (toId(message.content) === message.parent.status.userid && message.content.endsWith('?')) {
		return message.author.send(helpMessage);
	}
	if (message.author.id === 'dhelmise' && message.content.trim().toLowerCase() === 'fartbot?') {
		return message.reply(`${helpMessage}\nAlso, ${message.author.name} needs a shower.`);
	}

	if (message.content === `${prefix}eval 1`) message.reply('1');

	// Standard bot reply
	// Only reply if the message didn't start from the prefix...
	if (message.type === 'pm' && !message.content.startsWith(prefix)) {
		const { userid } = message.author;
		// Don't send the help message if sent in the last 5 minutes
		if (Date.now() - (PSNoPrefixHelp[userid]?.getTime() ?? 0) < fromHumanTime('5 minutes')) return;
		PSNoPrefixHelp[userid] = new Date();
		return message.reply(helpMessage);
	}

	if (message.type === 'chat') {
		if (['lunarnewyear'].includes(message.target.id)) {
			const HONSE_REGEX = /(\w*)horse(\w*)/i;
			if (HONSE_REGEX.test(message.content) && sample(20) === 0) {
				const honse = message.content.match(HONSE_REGEX)!;
				const honseText = honse[1] || honse[2] ? `*${honse[1]}HONSE${honse[2]}` : '*honse';
				message.reply(honseText);
			}
		}
	}
}
