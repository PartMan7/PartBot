export type Turn = 'W' | 'B';

export type Board = (null | Turn)[][];

export type State = {
	start: boolean;
	turn: Turn;
	board: Board;
	log: string;
};

export type RenderCtx = { board: Board; validMoves: [number, number][] };
export type WinCtx =
	| ({ type: 'win' } & Record<'winner' | 'loser', { name: string; id: string; turn: string; score: number }>)
	| { type: 'draw' };

export type GameTypes = { renderCtx: RenderCtx };
