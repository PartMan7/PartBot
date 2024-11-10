import type { Room } from 'ps-client';
import type { ReactElement } from 'react';
import type { ActionType, Game } from '@/ps/games/game';

export type Meta = {
	name: string;
	id: GamesList;
	aliases?: string[];

	turns?: Record<string, string>;

	allowForfeits?: boolean;
	autostart?: boolean;
};

export enum GamesList {
	Othello = 'othello',
}

export interface BaseGame {
	type: string; // TODO: valid game key
	id: string;
	room: Room;
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

export type GameRender<State extends BaseState, GameTypes extends BaseGameTypes> = (
	this: Game<State, GameTypes>,
	side: State['turn'] | null // null for spectators
) => ReactElement;

export type ActionResponse<T = undefined> = { success: true; data?: T } | { success: false; error: string };
