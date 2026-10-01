import type { BaseRenderCtx } from '@/ps/games/types';

export type Turn = 'W' | 'B';

export type Board = (null | Turn)[][];

export type State = {
	turn: Turn;
	board: Board;
};

export type RenderCtx = BaseRenderCtx & {
	id: string;
	board: Board;
	validMoves: [number, number][];
	score: Record<Turn, number>;
};
export type WinCtx =
	| ({ type: 'win' } & Record<'winner' | 'loser', { name: string; id: string; turn: string; score: number }>)
	| { type: 'draw' };
