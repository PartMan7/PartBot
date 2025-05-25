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
	hl?: string;
	last?: string;
};

export type RenderCtx = {
	id: string;
	side: Turn | null;
	turn: Turn;
	board: ReturnType<Chess['board']>;
	selected?: Square | null;
	isActive: boolean;
	showMoves: Move[];
	header?: string;
	dimHeader?: boolean;
	promotion?: boolean;
	theme: ThemeColours;
	small?: boolean;
};

export type WinCtx = ({ type: 'win' } & Record<'winner' | 'loser', { name: string; id: string; turn: string }>) | { type: 'draw' };
