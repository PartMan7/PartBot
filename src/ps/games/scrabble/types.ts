export type BoardTile = {
	letter: string;
	blank?: boolean;
	points: number;
};

export type Board = (null | BoardTile)[][];

export type State = {
	turn: string;
	board: Board;
	racks: Record<string, string[]>;
	best: Record<string, { points: number; asText: string } | undefined>;
	bag: string[];
};

export type RenderCtx = {
	id: string;
	board: Board;
	header?: string;
	dimHeader?: boolean;
	score: Record<string, number>;

	player: boolean;
	bag: number;
	hand: string[];
	selected?: [number, number] | false;
};
export type WinCtx =
	| ({ type: 'win' } & Record<'winner' | 'loser', { name: string; id: string; turn: string; score: number }>)
	| { type: 'draw' };
