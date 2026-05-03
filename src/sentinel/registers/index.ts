import { DISCORD_REGISTERS } from '@/sentinel/registers/discord';
import { PS_REGISTERS } from '@/sentinel/registers/ps';
import { WEB_REGISTERS } from '@/sentinel/registers/web';

import type { Register } from '@/sentinel/types';

export const registers: { list: Register[] } = {
	list: [...PS_REGISTERS, ...WEB_REGISTERS, ...DISCORD_REGISTERS],
};
