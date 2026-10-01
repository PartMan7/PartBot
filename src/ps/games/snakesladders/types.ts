import type { BaseRenderCtx } from '@/ps/games/types';

export type Board = Record<string, { pos: number; color: string; name: string }>;

export type State = {
	turn: string;
	board: Board;
	lastRoll: number;
};

export type RenderCtx = BaseRenderCtx & {
	id: string;
	turns: string[];
	board: Board;
	lastRoll: number;
	active?: boolean;
};
export type WinCtx = { type: 'win'; winner: { name: string; id: string; turn: string; board: Board } };
