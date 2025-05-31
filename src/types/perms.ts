import type { ranks } from '@/config/ps';
import type { PSMessage } from '@/types/ps';

export type Ranks = (typeof ranks)[number];
type StaticPerm = Ranks | ['room' | 'global', Exclude<Ranks, 'admin'>] | symbol;
export type Perms = StaticPerm | ((message: PSMessage, checkPermission: (staticPerm: StaticPerm) => boolean) => boolean);
