import type { CSSProperties } from 'react';

export type Turn = 'W' | 'B';

export type Board = (null | Turn)[][];

export type State = {
	start: boolean;
	turn: Turn;
	board: Board;
	log: string;
};

export type RenderCtx = {
	id: string;
	board: Board;
	validMoves: [number, number][];
	header?: string;
	dimHeader?: boolean;
	score: Record<Turn, number>;
};
export type WinCtx =
	| ({ type: 'win' } & Record<'winner' | 'loser', { name: string; id: string; turn: string; score: number }>)
	| { type: 'draw' };

export type GameTypes = { renderCtx: RenderCtx };
