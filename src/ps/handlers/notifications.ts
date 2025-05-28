import { ANNOUNCEMENTS_CHANNEL, ROLES } from '@/discord/constants/servers/petmods';
import { getChannel } from '@/discord/loaders/channels';
import { IS_ENABLED } from '@/enabled';

export async function notifyHandler(room: string, line: string, isIntro?: boolean): Promise<void> {
	if (isIntro) return;
	const [_title, message] = line.lazySplit('|', 1);

	if (room === 'petmods' && IS_ENABLED.DISCORD) {
		const lowercase = message.toLowerCase();
		if (lowercase.includes('chatbats') || lowercase.includes('pmcm'))
			getChannel(ANNOUNCEMENTS_CHANNEL)?.send(`${ROLES.CHATBATS} hi let's go!`);
		if (lowercase.includes('shinymons')) getChannel(ANNOUNCEMENTS_CHANNEL)?.send(`${ROLES.SHINYMONS} hi let's go!`);
	}
}
