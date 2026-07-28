import { AzulMods } from '@/ps/games/azul/constants';

import type { BaseModEntry } from '@/ps/games/mods';

export const AzulModData: Record<AzulMods, BaseModEntry> = {
	[AzulMods.FREE_GRID]: {
		id: AzulMods.FREE_GRID,
		name: 'Free Grid',
		desc: 'Wall has no predetermined colours; tiles still cannot share a row or column with the same colour.',
		aliases: ['free', 'freemap'],
	},
};
