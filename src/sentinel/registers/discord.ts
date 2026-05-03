import { IS_ENABLED } from '@/enabled';
import { cachebust } from '@/utils/cachebust';

import type { Register } from '@/sentinel/types';

export const DISCORD_REGISTERS: Register[] = IS_ENABLED.DISCORD
	? [
			{
				label: 'discord-feed',
				pattern: /\/discord\/handlers\/feed\.tsx?$/,
				reload: async filepaths => {
					const prev = await import('@/discord/handlers/feed');
					prev.closeJobs();
					filepaths.forEach(cachebust);
					const next = await import('@/discord/handlers/feed');
					next.initFeedCheck();
				},
			},
		]
	: [];
