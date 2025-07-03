import { ChannelType, type TextChannel } from 'discord.js';

import { IS_ENABLED } from '@/enabled';

export function getChannel(id: string): TextChannel | null {
	if (!IS_ENABLED.DISCORD) return null;
	const channel = Discord.channels.cache.get(id);
	if (!channel) return null;
	if (channel.type !== ChannelType.GuildText) return null;
	return channel;
}
