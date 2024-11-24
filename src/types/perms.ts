import type { ranks } from '@/config/ps';
import type { PSMessage } from '@/types/ps';

export type Ranks = (typeof ranks)[number];
export type Perms = Ranks | ['room' | 'global', Exclude<Ranks, 'admin'>] | symbol | ((message: PSMessage) => boolean);
