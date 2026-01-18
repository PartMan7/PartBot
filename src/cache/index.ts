import type { JudgementGame } from '@/discord/commands/judgement';
import type { TranslatedText } from '@/i18n/types';
import type { Games } from '@/ps/games';
import type { CommonGame } from '@/ps/games/game';
import type { PSCronJobManager } from '@/ps/handlers/cron';
import type { DiscordCommand, PSCommand } from '@/types/chat';
import type { Perms } from '@/types/perms';
import type { PSRoomConfig } from '@/types/ps';
import type { Timer } from '@/utils/timer';
import type { SlashCommandBuilder } from 'discord.js';

// Global cache
export const Timers: { [key: string]: Timer } = {};

// Showdown cache
export const PSRoomConfigs: Partial<{ [key: string]: PSRoomConfig }> = {};
export const PSCommands: { [key: string]: PSCommand & { path: string } } = {};
/**
 * Aliases delimited by ' '
 * @example 'voice': 'promote voice'
 */
export const PSAliases: { [key: string]: string } = {};
export const PSAltCache: Partial<{ [key: string]: { from: string; to: string; at: Date } }> = {};
export const PSJoinphraseCache: Partial<{
	[room: string]: Partial<{
		[userId: string]: {
			id: string;
			phrase: string;
			username: string;
			messageCount: number; // messages since last JP
			lastTime: number; // epoch timestamp of last JP
		};
	}>;
}> = {};
export const PSSeenCache: Partial<{ [key: string]: { id: string; name: string; at: Date; seenIn: string[] } }> = {};
export const PSCronJobs: { manager: PSCronJobManager | null } = { manager: null };

export const PSNoPrefixHelp: Partial<{ [key: string]: Date }> = {};
export const PSQuoteRoomPrefs: Partial<{ [key: string]: { room: string; at: Date } }> = {};
export const PSKuncInProgress: Partial<{ [key: string]: boolean }> = {};
export const PSNonces: Partial<{ [key: string]: { callback: () => TranslatedText | void; perms?: Perms } }> = {};
export const PSPointsNonce: Partial<{ [key: string]: Record<string, Record<string, number>> | null }> = {};
export const PSActiveRepeats: Map<string, NodeJS.Timeout> = new Map();

// Games
export const PSGames: { [key in keyof Games]?: Record<string, CommonGame> } = {};

// Discord
export const DiscCommands: { [key: string]: DiscordCommand & { path: string; isAlias?: boolean; slash: SlashCommandBuilder } } = {};
export const DiscGames: { judgement: Record<string, JudgementGame> } = { judgement: {} };
