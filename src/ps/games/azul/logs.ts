import type { BaseLog } from '@/ps/games/types';
import type { Satisfies, SerializedInstance } from '@/types/common';

export type Log = Satisfies<
	BaseLog,
	{
		time: Date;
		turn: string;
	} & (
		| {
				action: 'roll';
				ctx: number;
		  }
		| { action: 'skip'; ctx: null }
	)
>;

export type APILog = SerializedInstance<Log>;
