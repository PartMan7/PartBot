import { toId } from '@/tools';

export type ModEnum<Mod extends string> = Record<string, Mod>;
export type ModData<Mod extends string> = Partial<Record<Mod, { aliases?: string[] | undefined }>>;

export function parseMod<Mod extends string>(input: string, mods: ModEnum<Mod>, modData: ModData<Mod>): Mod | null {
	const query = toId(input);
	if (!query || query === 'constructor') return null;
	const direct = Object.values(mods).find(mod => mod === query);
	if (direct) return direct;
	for (const _mod in modData) {
		const mod = _mod as Mod;
		if (modData[mod]?.aliases?.includes(query)) return mod;
	}
	return null;
}
