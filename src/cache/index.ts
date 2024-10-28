import type { PSCommand } from '@/types/chat';
import type { PSRoomConfig } from '@/types/ps';
import type { Timer } from '@/utils/timer';

// Global cache
export const Timers: { [key: string]: Timer } = {};

// Showdown cache
export const PSRoomConfigs: { [key: string]: PSRoomConfig } = {};
export const PSCommands: { [key: string]: PSCommand & { path: string } } = {};
export const PSAliases: { [key: string]: string } = {};
export const PSNoPrefixHelp: { [key: string]: Date } = {};
export const PSAltCache: { [key: string]: { from: string; to: string; at: Date } } = {};
export const PSSeenCache: { [key: string]: { at: Date; in: string[] } } = {};

export const PSQuoteRoomPrefs: { [key: string]: { room: string; at: Date } } = {};
