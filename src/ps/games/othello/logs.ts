import type { BaseLog } from '@/ps/games/common';
import type { Turn } from '@/ps/games/othello/types';
import type { Satisfies, SerializedInstance } from '@/types/common';

export type Log = Satisfies<
	BaseLog,
	{
		time: Date;
		turn: Turn;
	} & (
		| {
				action: 'play';
				ctx: [number, number];
		  }
		| { action: 'skip'; ctx: null }
	)
>;

export type APILog = SerializedInstance<Log>;
