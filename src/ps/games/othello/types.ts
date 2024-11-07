export type Turn = 'W' | 'B';

export type Board = (null | Turn)[][];

export type State = {
	start: boolean;
	turn: Turn;
	board: Board;
	log: string;
};

export type RenderCtx = { board: Board; validMoves: [number, number][] };

export type GameTypes = { renderCtx: RenderCtx };
