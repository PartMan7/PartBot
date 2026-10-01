import type { BaseRenderCtx, Player } from '@/ps/games/types';

export type Turn = 'B' | 'W';

export type Board = (null | Turn)[][];

export type Move = { from: [number, number]; to: [number, number] };

export type State = {
	turn: Turn;
	board: Board;
};

export type RenderCtx = BaseRenderCtx & {
	id: string;
	board: Board;
	turn: Turn | null;
	selected: [number, number] | null;
	validMoves: Move[];
};

export type WinCtx = ({ type: 'win' } & Record<'winner' | 'loser', Player>) | { type: 'draw' };
