import { FlatCache } from 'flat-cache';
import { GamesList } from '@/ps/games/common';

export type GameBackup = {
	room: string;
	id: string;
	game: string;
	backup: string;
};

export type GameCache = {
	get(id: string): GameBackup;
	getByGame(room: string, game: GamesList | 'all'): GameBackup[];
	set(backup: GameBackup): void;
};

const cacheId = 'games.json';
const flatCache = new FlatCache({ cacheId: cacheId, cacheDir: fsPath('cache', 'flat-cache') });
flatCache.load(cacheId);

export const gameCache: GameCache = {
	get(id) {
		const lookup = flatCache.get<GameBackup>(id);
		if (!lookup) throw new Error(`Attempting to get ${id} but nothing found.`);
		return lookup;
	},
	getByGame(room, game) {
		const flatCacheObj: Record<string, GameBackup> = flatCache.all();
		const unfilteredGames = Object.values(flatCacheObj).filter(backup => backup.room === room);
		if (game === 'all') return unfilteredGames;
		return unfilteredGames.filter(backup => backup.game === game);
	},
	set(backup) {
		flatCache.set(backup.id, backup);
		flatCache.save();
	},
};
