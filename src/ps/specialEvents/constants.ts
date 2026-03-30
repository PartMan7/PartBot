import { Temporal } from '@js-temporal/polyfill';

import { GamesList } from '@/ps/games/types';
import { TimeZone } from '@/ps/handlers/cron/constants';

// Aug 16th, 2025 at midnight UTC
export const UGO_2025_START = Temporal.ZonedDateTime.from(`2025-08-16T00:00:00.000[${TimeZone.GMT}]`);
// Sep 8th, 2025 at midnight UTC
export const UGO_2025_END = Temporal.ZonedDateTime.from(`2025-09-08T00:00:00.000[${TimeZone.GMT}]`);
// Aug 19, Aug 29 are Board Game's Spotlights
export const UGO_2025_SPOTLIGHTS = [Temporal.PlainDate.from(`2025-08-19`), Temporal.PlainDate.from(`2025-08-29`)];

export const BG_STRUCHNI_MODIFIER = 0.15;

export const CHAIN_REACTION_META = {
	id: 'chainreaction',
	name: 'Chain Reaction',
	abbr: 'CR',
	ugo: {
		cap: 12,
		points: {
			win: (count: number) => 4 + 4 * count,
			loss: 5,
		},
	},
} as const;

export const BOARD_GAMES_STRUCHNI_ORDER = [
	GamesList.Battleship,
	CHAIN_REACTION_META.id,
	GamesList.Chess,
	GamesList.ConnectFour,
	GamesList.Othello,
	GamesList.Scrabble,
	GamesList.SnakesLadders,
	GamesList.Splendor,
] as const;
export type UGOBoardGames = (typeof BOARD_GAMES_STRUCHNI_ORDER)[number];
