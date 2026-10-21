import type { BaseRenderCtx, Player } from '@/ps/games/types';
import type { Hex } from '@/utils/color';

export type Turn = 'P1' | 'P2';

export type DiscStyle = { imageUrl: string; name: string; bgHex: Hex };

export type Board = (null | Turn)[][];

export type State = {
	turn: Turn;
	board: Board;
	discs: Record<Turn, DiscStyle>;
};

export type RenderCtx = BaseRenderCtx & {
	id: string;
	board: Board;
	discs: Record<Turn, DiscStyle>;
};
export type WinCtx = ({ type: 'win' } & Record<'winner' | 'loser', Player>) | { type: 'draw' };
