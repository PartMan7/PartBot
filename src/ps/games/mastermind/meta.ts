import { GamesList } from '@/ps/games/common';

import type { Meta } from '@/ps/games/common';

export const meta = {
	name: 'Mastermind',
	id: GamesList.Mastermind,
	aliases: ['mm'],
	abbr: 'mm',
	players: 'single',
} satisfies Meta;
