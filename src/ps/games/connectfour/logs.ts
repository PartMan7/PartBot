import type { BaseLog, CommonLog } from '@/ps/games/common';
import type { Turn } from '@/ps/games/connectfour/types';
import type { Satisfies, SerializedInstance } from '@/types/common';

export type Log = Satisfies<
	BaseLog,
	{
		time: Date;
		turn: Turn;
		action: 'play';
		ctx: number;
	}
>;

export type APILog = SerializedInstance<Log | CommonLog>;
