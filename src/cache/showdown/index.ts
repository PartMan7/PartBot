import { FlatCache } from 'flat-cache';

import { ShowdownDataKeys } from '@/cache/showdown/types';
import { fsPath } from '@/utils/fsPath';

import type { ShowdownDataType } from '@/cache/showdown/types';

const RANDOMS_SETS_URL = 'https://play.pokemonshowdown.com/data/sets/gen9.json';

export const ShowdownData: ShowdownDataType = {
	[ShowdownDataKeys.RandomSetsGen9]: {},
};

const ShowdownMetadata: {
	[Key in ShowdownDataKeys as Key]: {
		key: Key;
		cacheId: string;
		update: () => Promise<ShowdownDataType[Key]>;
	};
} = {
	[ShowdownDataKeys.RandomSetsGen9]: {
		key: ShowdownDataKeys.RandomSetsGen9,
		cacheId: 'randomSetsGen9.json',
		update: async () => {
			const res = await fetch(RANDOMS_SETS_URL);
			if (!res.ok) throw new Error(res.statusText);
			return (await res.json()) as ShowdownDataType[ShowdownDataKeys.RandomSetsGen9];
		},
	},
};

const ShowdownFlatCaches = Object.fromEntries(
	Object.values(ShowdownMetadata).map(({ key, cacheId }) => {
		const flatCache = new FlatCache({ cacheId, cacheDir: fsPath('cache', 'flat-cache') });
		flatCache.load(cacheId);

		const existing = flatCache.get<ShowdownDataType[typeof key]>('value');
		if (existing) ShowdownData[key] = existing;
		return [key, flatCache];
	})
) as Record<ShowdownDataKeys, FlatCache>;

export async function updateShowdownData(keys?: ShowdownDataKeys[]): Promise<void> {
	const toUpdate = keys ?? (Object.keys(ShowdownMetadata) as ShowdownDataKeys[]);
	await Promise.all(
		toUpdate.map(async key => {
			const data = await ShowdownMetadata[key].update();
			ShowdownData[key] = data;
			ShowdownFlatCaches[key].set('value', data);
			ShowdownFlatCaches[key].save();
		})
	);
}
