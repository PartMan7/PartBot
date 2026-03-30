import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity';

import { usePersistedCache } from '@/cache/persisted';
import { isUGOActive } from '@/ps/specialEvents';

import type { CommonGame } from '@/ps/games/game';
import type { Meta } from '@/ps/games/types';
import type { UGOBoardGames } from '@/ps/specialEvents/constants';

const idCache = usePersistedCache('gameId');

const dataset = englishDataset.build();
const obscenityMatcher = new RegExpMatcher({ ...dataset, ...englishRecommendedTransformers });

// IDs are meant to be 4-character alphanumeric codes preceded with a '#'.
// I'm assuming we won't need more than 36^4 IDs...
export function generateId(): string {
	if (process.env.NODE_ENV === 'development') return '#TEMP';

	let lastId = idCache.get();

	while (true) {
		const newId = lastId + 1;
		const idNum = (newId * 999979) % 36 ** 4;
		const generatedId = idNum.toString(36).padStart(4, '0').toUpperCase();

		if (!obscenityMatcher.hasMatch(generatedId)) {
			idCache.set(newId);
			return `#${generatedId}`;
		}

		// If obscene, try the next ID
		lastId = newId;
	}
}

export function createGrid<T>(x: number, y: number, fill: (x: number, y: number) => T) {
	return Array.from({ length: x }).map((_, i) => Array.from({ length: y }).map((_, j) => fill(i, j)));
}

export function checkUGO(
	game: CommonGame
): game is CommonGame & { meta: Meta & { id: UGOBoardGames; ugo: NonNullable<Meta['ugo']> } } {
	if (!isUGOActive()) return false;
	return game.roomid === 'boardgames' && !!game.meta.ugo;
}
