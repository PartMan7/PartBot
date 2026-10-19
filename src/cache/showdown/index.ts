import { FlatCache } from 'flat-cache';
import { fetch as fetchPSDatacenters } from 'ps-client/tools';

import { ShowdownDataKeys } from '@/cache/showdown/types';
import { applyPSDatacenters } from '@/ps/datacenters';
import { fsPath } from '@/utils/fsPath';

import type { ShowdownDataType } from '@/cache/showdown/types';

const RANDOMS_SETS_URL =
	'https://raw.githubusercontent.com/smogon/pokemon-showdown/refs/heads/master/data/random-battles/gen9/sets.json';

export const ShowdownData: ShowdownDataType = {
	[ShowdownDataKeys.RandomSetsGen9]: {},
	[ShowdownDataKeys.PSDatacenters]: {},
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
	[ShowdownDataKeys.PSDatacenters]: {
		key: ShowdownDataKeys.PSDatacenters,
		cacheId: 'ps-datacenters.json',
		update: () => fetchPSDatacenters(),
	},
};

function hydrateShowdownData<Key extends ShowdownDataKeys>(key: Key, data: ShowdownDataType[Key]) {
	ShowdownData[key] = data;
	if (key === ShowdownDataKeys.PSDatacenters) applyPSDatacenters(data as ShowdownDataType[ShowdownDataKeys.PSDatacenters]);
}

const ShowdownFlatCaches = {} as Record<ShowdownDataKeys, FlatCache>;
for (const key of Object.keys(ShowdownMetadata) as ShowdownDataKeys[]) {
	const { cacheId } = ShowdownMetadata[key];
	const flatCache = new FlatCache({ cacheId, cacheDir: fsPath('cache', 'flat-cache') });
	flatCache.load(cacheId);

	const existing = flatCache.get<ShowdownDataType[typeof key]>('value');
	if (existing) hydrateShowdownData(key, existing);
	ShowdownFlatCaches[key] = flatCache;
}

export async function updateShowdownData(keys?: ShowdownDataKeys[]): Promise<void> {
	const toUpdate = keys ?? (Object.keys(ShowdownMetadata) as ShowdownDataKeys[]);
	await Promise.all(
		toUpdate.map(async key => {
			const data = await ShowdownMetadata[key].update();
			hydrateShowdownData(key, data);
			ShowdownFlatCaches[key].set('value', data);
			ShowdownFlatCaches[key].save();
		})
	);
}
