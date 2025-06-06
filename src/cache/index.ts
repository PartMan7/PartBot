import type { JudgementGame } from '@/discord/commands/judgement';
import type { Games } from '@/ps/games';
import type { CommonGame } from '@/ps/games/game';
import type { PSCronJobManager } from '@/ps/handlers/cron';
import type { DiscCommand, PSCommand } from '@/types/chat';
import type { PSRoomConfig } from '@/types/ps';
import type { Timer } from '@/utils/timer';
import type { SlashCommandBuilder } from 'discord.js';

// Global cache
export const Timers: { [key: string]: Timer } = {};

// Showdown cache
export const PSRoomConfigs: { [key: string]: PSRoomConfig } = {};
export const PSCommands: { [key: string]: PSCommand & { path: string } } = {};
export const PSAliases: { [key: string]: string } = {};
export const PSAltCache: { [key: string]: { from: string; to: string; at: Date } } = {};
export const PSSeenCache: { [key: string]: { id: string; name: string; at: Date; seenIn: string[] } } = {};
export const PSCronJobs: { manager: PSCronJobManager | null } = { manager: null };

export const PSNoPrefixHelp: { [key: string]: Date } = {};
export const PSQuoteRoomPrefs: { [key: string]: { room: string; at: Date } } = {};
export const PSKuncInProgress: { [key: string]: boolean } = {};
export const PSPointsNonce: { [key: string]: Record<string, Record<string, number>> | null } = {};

// Games
export const PSGames: { [key in keyof Games]?: Record<string, CommonGame> } = {};

// Discord
export const DiscCommands: { [key: string]: DiscCommand & { path: string; isAlias?: boolean; slash: SlashCommandBuilder } } = {};
export const DiscGames: { judgement: Record<string, JudgementGame> } = { judgement: {} };
