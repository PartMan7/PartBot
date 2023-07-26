import { ranks } from 'config/ps';
import type { Message } from 'types/ps';

export type Ranks = typeof ranks[number];
export type Perms = Ranks | ((message: Message) => boolean);

