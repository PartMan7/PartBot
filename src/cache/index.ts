import type { PSCommand } from 'types/chat';
import type { Timer } from 'utils/timer';

export const NoPrefixHelp: { [key: string]: Date } = {};
export const PSCommands: { [key: string]: PSCommand } = {};
export const PSAliases: { [key: string]: string } = {};
export const Timers: { [key: string]: Timer } = {};
