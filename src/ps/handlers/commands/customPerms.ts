import type { Perms } from '@/types/perms';

export default {
	[Symbol.for('games.create')]: 'whitelist',
	[Symbol.for('games.manage')]: 'driver',
} as Record<symbol, Exclude<Perms, symbol>>;
