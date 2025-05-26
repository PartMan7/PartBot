import type { TranslatedText } from '@/i18n/types';
import type { ModData, ModEnum } from '@/ps/games/mods';
import type { Satisfies } from '@/types/common';

export type Meta = Readonly<{
	// The name of the game must match the exported class after removing spaces
	name: string;
	id: GamesList;
	aliases?: readonly string[];
	/** Only for single-player games. Required for those. */
	abbr?: string;

	players: 'single' | 'many';
	turns?: Readonly<Record<string, string>>;
	minSize?: number;
	maxSize?: number;

	mods?: Readonly<{ list: ModEnum<string>; data: ModData<string> }>;

	/** @default Assume true */
	autostart?: boolean;
	timer?: number | false;
	pokeTimer?: number | false | undefined;
}>;

// Note: The values here MUST match the folder name!
export enum GamesList {
	Chess = 'chess',
	ConnectFour = 'connectfour',
	LightsOut = 'lightsout',
	Mastermind = 'mastermind',
	Othello = 'othello',
	Scrabble = 'scrabble',
}

export interface Player {
	name: string;
	id: string;
	turn: string;
	out?: boolean;
}

export type BaseState = { board: unknown; turn: string };

export type ActionResponse<T = undefined> = { success: true; data: T } | { success: false; error: TranslatedText };

export type EndType = 'regular' | 'force' | 'dq' | 'loss';

export type BaseLog = { action: string; time: Date; turn: string | null; ctx: unknown };

export type CommonLog<Turn extends string = string> = Satisfies<
	BaseLog,
	{ action: 'dq' | 'forfeit'; time: Date; turn: Turn; ctx: null }
>;
