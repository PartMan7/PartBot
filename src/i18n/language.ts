import { PSRoomConfigs } from '@/cache';

import type { Language } from '@/i18n/index';
import type { Room, User } from 'ps-client';

export function getLanguage(target: Room | User | undefined): Language | undefined {
	if (!target) return;
	if ('userid' in target) return;
	return PSRoomConfigs[target.id]?.language;
}
