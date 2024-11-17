import type { ActionType } from '@/ps/games/game';

export type Meta = {
	name: string;
	id: GamesList;
	aliases?: string[];

	turns?: Record<string, string>;
	minSize?: number;
	maxSize?: number;

	allowForfeits?: boolean;
	autostart?: boolean;
	timer: number | false;
	pokeTimer: number | false | undefined;
};

export enum GamesList {
	Othello = 'othello',
}

export interface BasePlayer {
	name: string;
	id: string;
	turn: string;
}

export type BaseState = { board: unknown; turn: string };
export type BaseGameTypes = {
	player?: Record<string, unknown>;
	actions?: { type: ActionType; name: string }[];
	log?: unknown;
};

export type ActionResponse<T = undefined> = { success: true; data?: T } | { success: false; error: string };
