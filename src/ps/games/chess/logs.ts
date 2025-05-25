import type { Turn } from '@/ps/games/chess/types';
import type { BaseLog } from '@/ps/games/common';
import type { Satisfies, SerializedInstance } from '@/types/common';

export type Log = Satisfies<
	BaseLog,
	{
		time: Date;
		turn: Turn;
		action: 'play';
		ctx: { from: string; to: string; promotion?: string; san: string };
	}
>;

export type APILog = SerializedInstance<Log>;
