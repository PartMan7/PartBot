import type { ACTIONS, POST_TURN_ACTIONS } from '@/ps/games/splendor/constants';
import type { TokenCount, Turn } from '@/ps/games/splendor/types';
import type { BaseLog } from '@/ps/games/types';
import type { Satisfies, SerializedInstance } from '@/types/common';

export type Log = Satisfies<
	BaseLog,
	{
		time: Date;
		turn: Turn;
	} & (
		| {
				action: ACTIONS.BUY;
				ctx: { id: string; cost: Partial<TokenCount> };
		  }
		| {
				action: ACTIONS.BUY_RESERVE;
				ctx: { id: string; cost: Partial<TokenCount> };
		  }
		| {
				action: ACTIONS.RESERVE;
				ctx: { id: string; gotDragon?: boolean; deck: number | null };
		  }
		| {
				action: ACTIONS.DRAW;
				ctx: { tokens: Partial<TokenCount>; totalTokens: number };
		  }
		| {
				action: POST_TURN_ACTIONS.TOO_MANY_TOKENS;
				ctx: { discard: Partial<TokenCount> };
		  }
		| {
				action: POST_TURN_ACTIONS.CLAIM_TRAINER;
				ctx: { trainerId: string };
		  }
		| { action: 'pass'; ctx: null }
	)
>;

export type APILog = SerializedInstance<Log>;
