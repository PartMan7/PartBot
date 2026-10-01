import type { BaseRenderCtx, Player } from '@/ps/games/types';

export type Turn = 'Y' | 'R';

export type Board = (null | Turn)[][];

export type State = {
	turn: Turn;
	board: Board;
};

export type RenderCtx = BaseRenderCtx & {
	id: string;
	board: Board;
};
export type WinCtx = ({ type: 'win' } & Record<'winner' | 'loser', Player>) | { type: 'draw' };
