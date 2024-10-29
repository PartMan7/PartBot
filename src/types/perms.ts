import { ranks } from '@/config/ps';

export type Ranks = (typeof ranks)[number];
export type Perms = Ranks | ['room' | 'global', Exclude<Ranks, 'admin'>] | symbol | ((message: PSMessage) => boolean);
