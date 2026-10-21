import type { BaseRenderCtx, Player } from '@/ps/games/types';
import type { TypeTokenStyle } from '@/utils/colorSampler';

export type Turn = 'P1' | 'P2';

export type Board = (null | Turn)[][];

export type State = {
	turn: Turn;
	board: Board;
	discs: Record<Turn, TypeTokenStyle>;
};

export type RenderCtx = BaseRenderCtx & {
	id: string;
	board: Board;
	discs: Record<Turn, TypeTokenStyle>;
};
export type WinCtx = ({ type: 'win' } & Record<'winner' | 'loser', Player>) | { type: 'draw' };
