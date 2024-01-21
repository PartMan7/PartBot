import { ranks } from 'config/ps';
import type { Message } from 'ps-client';

export type Ranks = typeof ranks[number];
export type Perms = Ranks | ['room' | 'global', Exclude<Ranks, 'admin'>] | symbol | ((message: Message) => boolean);
