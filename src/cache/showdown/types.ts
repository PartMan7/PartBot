export enum ShowdownDataKeys {
	RandomSetsGen9 = 'random-sets-gen-9',
}

export type Gen9ShowdownSet = {
	role: string;
	movepool: string[];
	abilities: string[];
	teraTypes: string[];
};

export interface ShowdownDataType extends Record<ShowdownDataKeys, unknown> {
	[ShowdownDataKeys.RandomSetsGen9]: Record<string, { level: number; sets: Gen9ShowdownSet[] }>;
}
