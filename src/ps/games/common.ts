export type Meta = {
	name: string;
	id: GamesList;
	aliases?: readonly string[];

	players: 'single' | 'many';
	turns?: Record<string, string>;
	minSize?: number;
	maxSize?: number;

	autostart?: boolean;
	timer?: number | false;
	pokeTimer?: number | false | undefined;
};

export enum GamesList {
	Othello = 'othello',
	Mastermind = 'mastermind',
}

export interface Player {
	name: string;
	id: string;
	turn: string;
	out?: boolean;
}

export type BaseState = { board: unknown; turn: string };

export type ActionResponse<T = undefined> = { success: true; data?: T } | { success: false; error: string };

export type EndType = 'regular' | 'force' | 'dq' | 'loss';
