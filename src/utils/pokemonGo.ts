import CP_SCALING from '@/static/go/cpScaling.json';

import type { PokemonGO } from '@/cache/pokemonGo';

export function getCP(stats: PokemonGO.Stats, level?: number, ivs?: PokemonGO.Stats): number {
	if (!level) level = 40;
	if (!ivs) ivs = { atk: 15, def: 15, sta: 15 };
	if (Array.isArray(ivs)) ivs = { atk: ivs[0], def: ivs[1], sta: ivs[2] };

	const atk = stats.atk + ivs.atk,
		def = stats.def + ivs.def,
		sta = stats.sta + ivs.sta;

	// Formula used in-game
	const CP = Math.floor((atk * def ** 0.5 * sta ** 0.5 * ((CP_SCALING as Record<number, number>)[level] || 0.7903) ** 2) / 10);
	return Math.max(CP, 10);
}
