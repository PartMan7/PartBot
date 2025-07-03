import type { Point } from '@/utils/grid';

export type BoardTile = {
	letter: string;
	blank?: boolean;
	points: number;
	pos: Point;
};

// prettier-ignore
type Letter = 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J'|'K'|'L'|'M'|'N'|'O'|'P'|'Q'|'R'|'S'|'T'|'U'|'V'|'W'|'X'|'Y'|'Z'|'_';
export type LetterMetadata = Record<Letter, number>;

export type Bonus = '3W' | '2W' | '3L' | '2L' | '2*';
export type BonusReducer = { apply: (score: number) => number; weight: number };

export type BaseBoard = (Bonus | null)[][];
export type Board = (null | BoardTile)[][];

export type State = {
	turn: string;
	baseBoard: BaseBoard;
	board: Board;
	racks: Record<string, string[]>;
	score: Record<string, number>;
	bag: string[];
	best: Record<string, { points: number; asText: string } | undefined>;
};

export type Points = {
	total: number;
	bingo: boolean;
	words: Record<string, number>;
};

export type RenderCtx = {
	id: string;
	baseBoard: BaseBoard;
	board: Board;
	header?: string;
	dimHeader?: boolean;
	players: Record<string, { score: number; name: string; rack: number; out?: boolean | undefined }>;
	getPoints: (tile: string) => number;
	bag: number;
	rack: string[] | undefined;
	isActive: boolean;
	side: string | null;
	turn: string;
	selected?: Point | null;
};
export type WinCtx = { type: 'win'; winnerIds: string[]; score: State['score'] } | { type: 'draw' };

export type Word = { word: string; baseScore: number; bonuses: BonusReducer[] };
export type WordScore = [times: number, plus: number];
