import type { POST_TURN_ACTIONS, Tile, VIEW_ACTION_TYPE } from '@/ps/games/azul/constants';

export type Turn = string;

export type Factory = Partial<Record<Tile, number>>;

export type FloorTile = Tile | 'first';

export type PlayerBoard = {
	id: string;
	name: string;
	score: number;
	/** Pattern lines; row i has length i+1 */
	pattern: (Tile | null)[][];
	/** 5x5 wall */
	wall: (Tile | null)[][];
	floor: FloorTile[];
	out?: boolean;
};

export type Center = Factory & { first: boolean };

export type Board = {
	factories: Factory[];
	center: Center;
};

export type PendingWall = {
	turn: Turn;
	row: number;
	color: Tile;
};

export type ActionState =
	| { action: VIEW_ACTION_TYPE.NONE }
	| {
			action: VIEW_ACTION_TYPE.PLACE;
			source: 'center' | number;
			color: Tile;
			count: number;
			tookFirst: boolean;
	  }
	| { action: POST_TURN_ACTIONS.WALL; pending: PendingWall };

type ActivePlayer = {
	type: 'player';
	active: true;
	self: Turn;
};

export type ViewType =
	| {
			type: 'spectator';
			active: false;
			action: VIEW_ACTION_TYPE.GAME_END | null;
	  }
	| {
			type: 'player';
			active: false;
			self: Turn;
	  }
	| (ActivePlayer & ActionState);

export type State = {
	turn: Turn;
	board: Board;
	bag: Tile[];
	lid: Tile[];
	playerData: Record<Turn, PlayerBoard>;
	actionState: ActionState;
	/** Queue of free-grid wall placements still needing a column */
	wallQueue: PendingWall[];
	/** Who took the starting-player marker this round (null until taken) */
	nextStarter: Turn | null;
	/** After wall tiling, end the game instead of refilling */
	ending: boolean;
	round: number;
};

export type RenderCtx = {
	id: string;
	board: Board;
	bag: Tile[];
	players: Record<Turn, PlayerBoard>;
	turns: Turn[];
	view: ViewType;
	freeGrid: boolean;
	round: number;
	ended?: boolean;
	/** Chat finish broadcast: only 5x5 walls */
	wallsOnly?: boolean;
	header?: string;
	dimHeader?: boolean;
};

export type WinCtx = {
	type: 'win';
	winner: PlayerBoard;
	ranked: PlayerBoard[];
};
