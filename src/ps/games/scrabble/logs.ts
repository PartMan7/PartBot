import type { BaseLog } from '@/ps/games/common';
import type { DIRECTION } from '@/ps/games/scrabble/constants';
import type { BoardTile } from '@/ps/games/scrabble/types';
import type { Satisfies, SerializedInstance } from '@/types/common';

export type Log = Satisfies<
	BaseLog,
	{
		time: Date;
		turn: string;
	} & (
		| {
				action: 'play';
				ctx: { points: number; tiles: BoardTile[]; dir: DIRECTION; x: number; y: number; newTiles: string[]; rack: string[] };
		  }
		| { action: 'exchange'; ctx: { tiles: string[]; newTiles: string[]; rack: string[] } }
		| { action: 'pass'; ctx: { rack: string[] } }
	)
>;

export type APILog = SerializedInstance<Log>;
