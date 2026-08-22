import type { PieceId } from '@/ps/games/blokus/constants';

export type Turn = string;

export type State = {
	turn: Turn;
	board: (Turn | null)[][];
	size: number;
	playerIndex: Record<Turn, number>;
	pieces: Record<Turn, PieceId[]>;
	placed: Record<Turn, boolean>;
};

export type RenderCtx = {
	id: string;
	header?: string;
	dimHeader?: boolean;
	board: (Turn | null)[][];
	size: number;
	turn: Turn;
	side: Turn | null;
	isActive: boolean;
	playerIndex: Record<Turn, number>;
	pieces: Record<Turn, PieceId[]>;
	players: Record<Turn, { id: string; name: string }>;
	selectedPiece: PieceId | null;
	selectedOrient: number | null;
	orientations: [number, number][][] | null;
	validAnchors: [number, number][];
	colors: readonly string[];
};

export type WinCtx =
	| { type: 'win'; winner: { id: string; name: string; turn: string; remaining: number } }
	| { type: 'win'; winnerIds: string[]; remaining: Record<Turn, number> };
