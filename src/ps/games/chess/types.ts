import type { BaseRenderCtx } from '@/ps/games/types';
import type { Chess, Move, Square } from 'chess.js';

export type Turn = 'W' | 'B';

export type State = {
	turn: Turn;
	board: null;
	pgn: string;
};

export type ThemeColours = {
	W: string;
	B: string;
	sel: string;
	hl: string | null;
	last: string | null;
};

export type RenderCtx = BaseRenderCtx & {
	id: string;
	side: Turn | null;
	turn: Turn;
	lastMove: Move | null;
	board: ReturnType<Chess['board']>;
	selected?: Square | null;
	isActive: boolean;
	showMoves: Move[];
	promotion?: boolean;
	theme: ThemeColours;
};

export type WinCtx = ({ type: 'win' } & Record<'winner' | 'loser', { name: string; id: string; turn: string }>) | { type: 'draw' };
