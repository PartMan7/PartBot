// Types for Azul

export enum Tile {
	Blue = 'blue',
	Yellow = 'yellow',
	Red = 'red',
	LightBlue = 'lightBlue',
	Black = 'black',
}

export type PlayerBoard = {
	rows: (Tile | null)[];
	grid: (Tile | null)[][];
};

export type Factory = Partial<Record<Tile, number>>;

export type Board = {
	players: Record<string, PlayerBoard>;
	factories: Factory[];
	center: Factory;
};

export type State = {
	turn: string;
	board: Board;
	lastRoll: number;
};

export type RenderCtx = {
	id: string;
	turns: string[];
	board: Board;
	lastRoll: number;
	active?: boolean;
	header?: string;
	dimHeader?: boolean;
};
export type WinCtx = { type: 'win'; winner: { name: string; id: string; turn: string; board: Board } };
