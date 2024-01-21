import type { Perms } from 'types/perms';

export default Object.fromEntries(Object.entries({
	'games.create': 'voice'
} as Record<string, Exclude<Perms, symbol>>).map(([key, perm]) => {
	return [Symbol.for(key), perm];
})) as Record<symbol, Exclude<Perms, symbol>>;
