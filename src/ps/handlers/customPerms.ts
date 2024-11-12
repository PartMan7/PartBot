import type { Perms } from '@/types/perms';

export default {
	[Symbol.for('games.create')]: 'voice',
	[Symbol.for('games.manage')]: 'driver',
} as Record<symbol, Exclude<Perms, symbol>>;
