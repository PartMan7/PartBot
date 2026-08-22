import type { PieceId } from '@/ps/games/blokus/constants';
import type { Turn } from '@/ps/games/blokus/types';
import type { BaseLog } from '@/ps/games/types';

export type Log = { action: 'play'; time: Date; turn: Turn; ctx: { piece: PieceId; anchor: [number, number] } } & BaseLog;
