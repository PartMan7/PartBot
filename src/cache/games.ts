import { FlatCache } from 'flat-cache';
import { GamesList } from '@/ps/games/common';

export type GameCache = {
	get(id: string): string;
	getByGame(game: GamesList | 'all'): string[];
	set(id: string, arg: string): void;
};

let gameCache: GameCache | null = null;

export function useGameCache(): GameCache {
	if (gameCache) return gameCache;
	const cacheId = 'games.json';
	const flatCache = new FlatCache({ cacheId: cacheId, cacheDir: fsPath('cache', 'flat-cache') });
	flatCache.load(cacheId);

	gameCache = {
		get(id) {
			const lookup = flatCache.get<string>(id);
			if (!lookup) throw new Error(`Attempting to get ${id} but nothing found.`);
			return lookup;
		},
		getByGame(game) {
			const flatCacheObj = flatCache.all();
			const unfilteredGames = Object.values(flatCacheObj);
			if (game === 'all') return unfilteredGames;
			return unfilteredGames.filter(gameLog => {
				try {
					const parsed = JSON.parse(gameLog);
					return 'meta' in parsed && 'id' in parsed.meta && parsed.meta.id === game;
				} catch (e) {
					log(`Error parsing backups for: ${gameLog}`, e);
					return false;
				}
			});
		},
		set(id, value) {
			flatCache.set(id, value);
			flatCache.save();
		},
	};
	return gameCache;
}
