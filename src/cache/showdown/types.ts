import type { Datacenters } from 'ps-client/data';

export enum ShowdownDataKeys {
	RandomSetsGen9 = 'random-sets-gen-9',
	PSDatacenters = 'ps-datacenters',
}

export type Gen9ShowdownSet = {
	role: string;
	movepool: string[];
	abilities: string[];
	teraTypes: string[];
};

export type ShowdownDataType = {
	[ShowdownDataKeys.RandomSetsGen9]: Record<string, { level: number; sets: Gen9ShowdownSet[] }>;
	[ShowdownDataKeys.PSDatacenters]: Partial<Datacenters>;
};
