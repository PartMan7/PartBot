import type { ShipType } from '@/ps/games/battleship/constants';
import type { Player } from '@/ps/games/types';
import type { Point } from '@/utils/grid';

export type Turn = 'A' | 'B';

export type ShipBoard = (ShipType | null)[][];
export type AttackBoard = (ShipType | null)[][];
export type Boards = { ships: Record<Turn, ShipBoard>; attacks: Record<Turn, AttackBoard> };

export type State = {
	turn: Turn;
	ready: Record<Turn, boolean | Record<ShipType, [Point, Point]>>; // object only when previewing ships but not ready yet
	board: Boards;
};

export type RenderCtx = {
	id: string;
	header?: string;
	dimHeader?: boolean;
} & (
	| { type: 'player'; attack: AttackBoard; defense: AttackBoard; actual: ShipBoard | null }
	| { type: 'spectator'; boards: Boards['attacks'] }
);
export type WinCtx = ({ type: 'win' } & Record<'winner' | 'loser', Player>) | { type: 'draw' };
