import type { TranslatedText } from '@/i18n/types';
import type { ModData, ModEnum } from '@/ps/games/mods';
import type { Satisfies } from '@/types/common';
import type { ReactElement } from 'react';

export interface HTPImage {
	/** Path under `/static/guides/`, e.g. `othello/setup.png`. */
	path: string;
	alt?: string;
	width?: number;
	height?: number;
}

export interface HTPDropdown {
	title: string;
	lines?: string[];
	images?: HTPImage[];
	content?: ReactElement;
	subsections?: HTPDropdown[];
}

export interface GameHTPData {
	goal: string;
	sections: HTPDropdown[];
}

export type Theme<Colors extends Partial<Record<string, string | null>> = Partial<Record<string, string | null>>> = {
	id: string;
	name: string;
	aliases: string[];
	colors: Colors;
};

export type Meta = Readonly<
	{
		// The name of the game must match the exported class after removing spaces
		name: string;
		id: GamesList;
		aliases?: readonly string[];
		/** Required for single-player games. Otherwise only shown in leaderboards. */
		abbr?: string;

		players: 'single' | 'many';
		turns?: Readonly<Record<string, string>>;
		minSize?: number;
		maxSize?: number;

		mods?: Readonly<{ list: ModEnum<string>; data: ModData<string> }>;

		/** Whether the game will only start automatically. */
		autostart?: boolean;
		timer?: number | false;
		pokeTimer?: number | false | undefined;

		/** Enables `offerdraw`: pending offer expires after 1 minute or when any player makes a move. */
		canOfferDraws?: boolean;

		/** How to play instructions. */
		htp: GameHTPData;

		// UGO-CODE
		/**
		 * Metadata for automatic UGO points.
		 */
		ugo: {
			points: { win: number | ((playerCount: number) => number); loss: number; draw?: number };
			cap: number;
		} | null;
	} & ({ themes: Record<string, Theme>; defaultTheme: string } | { themes?: undefined; defaultTheme?: undefined })
>;

// Note: The values here MUST match the folder name!
export enum GamesList {
	Azul = 'azul',
	Battleship = 'battleship',
	Chess = 'chess',
	ConnectFour = 'connectfour',
	LightsOut = 'lightsout',
	Mastermind = 'mastermind',
	Othello = 'othello',
	Scrabble = 'scrabble',
	SnakesLadders = 'snakesladders',
	Splendor = 'splendor',
}

export interface Player {
	name: string;
	id: string;
	turn: string;
	out?: boolean;
}

export type BaseState = { board: unknown; turn: string };

export type ActionResponse<T = null> = { success: true; data: T } | { success: false; error: TranslatedText };

export type EndType = 'regular' | 'force' | 'dq' | 'loss';

export type BaseLog = { action: string; time: Date; turn: string | null; ctx: unknown };
export type BaseLogAction = { action: 'dq' | 'forfeit' | 'skip'; turn: string; ctx: null } & BaseLog;

export type CommonLog<Turn extends string = string> = Satisfies<
	BaseLog,
	{ action: 'dq' | 'forfeit'; time: Date; turn: Turn; ctx: null }
>;
