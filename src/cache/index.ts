import type { PSCommand } from 'types/chat';
import type { Timer } from 'utils/timer';

// Global cache
export const Timers: { [key: string]: Timer } = {};

// Showdown cache
export const PSNoPrefixHelp: { [key: string]: Date } = {};
export const PSCommands: { [key: string]: PSCommand } = {};
export const PSAliases: { [key: string]: string } = {};
export const PSAltCache: { [key: string]: { from: string, to: string, at: Date } } = {};
export const PSSeenCache: { [key: string]: { at: Date, in: string[] } } = {};
