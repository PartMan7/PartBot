import type { ACTIONS, POST_TURN_ACTIONS, Tile } from '@/ps/games/azul/constants';
import type { Turn } from '@/ps/games/azul/types';
import type { BaseLog } from '@/ps/games/types';
import type { Satisfies, SerializedInstance } from '@/types/common';

export type Log = Satisfies<
	BaseLog,
	{
		time: Date;
		turn: Turn;
	} & (
		| {
				action: ACTIONS.TAKE;
				ctx: { source: 'center' | number; color: Tile; count: number; tookFirst: boolean };
		  }
		| {
				action: ACTIONS.PLACE;
				ctx: { color: Tile; count: number; row: number | 'floor'; overflow: number };
		  }
		| {
				action: POST_TURN_ACTIONS.WALL;
				ctx: { row: number; col: number; color: Tile; points: number };
		  }
		| { action: 'skip'; ctx: null }
	)
>;

export type APILog = SerializedInstance<Log>;
