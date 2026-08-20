import type { Turn } from '@/ps/games/linesofaction/types';
import type { BaseLog } from '@/ps/games/types';
import type { Satisfies, SerializedInstance } from '@/types/common';

export type Log = Satisfies<
	BaseLog,
	{
		time: Date;
		turn: Turn;
	} & (
		| {
				action: 'play';
				ctx: { from: [number, number]; to: [number, number]; capture?: Turn };
		  }
		| { action: 'skip'; ctx: null }
	)
>;

export type APILog = SerializedInstance<Log>;
