import { usePersistedCache } from '@/cache/persisted';

const idCache = usePersistedCache('gameId');

// IDs are meant to be 4-character alphanumeric codes preceded with a '#'.
// I'm assuming we won't need more than 36^4 IDs...
export function generateId(): string {
	const lastId = idCache.get();
	const newId = lastId + 1;
	idCache.set(newId);

	const idNum = (newId * 999979) % 36 ** 4;
	return `#${idNum.toString(36).padStart(4, '0').toUpperCase()}`;
}
