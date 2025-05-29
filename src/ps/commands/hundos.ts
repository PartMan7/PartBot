import { GOData } from '@/cache/pokemonGo';
import { ChatError } from '@/utils/chatError';
import { getCP } from '@/utils/pokemonGo';
import { queryMon } from '@/utils/queryMon';

import type { PokemonGO } from '@/cache/pokemonGo';
import type { ToTranslate } from '@/i18n/types';
import type { PSCommand } from '@/types/chat';

export const command: PSCommand = {
	name: 'hundos',
	help: "Shows a Pokémon's hundo-CP at specific levels.",
	syntax: 'CMD [mon], [levels...?]',
	aliases: ['hundo'],
	// TODO: GO-only
	async run({ arg, broadcast, $T }) {
		const [monName, levelsText] = arg.lazySplit(/\s*,\s*/, 1);
		const baseMon = queryMon(monName);
		if (!baseMon) throw new ChatError($T('MONS.NOT_FOUND', { name: monName }));
		const mon = GOData.pokedex[baseMon.id];
		if (!mon) throw new Error(`Missing ${baseMon.id} from GO Dex. Poke Mex!`);
		const givenLevels = levelsText?.match(/\d+/);
		const levels: [number, number?] = givenLevels ? [+givenLevels] : [20, 25];
		const ivRange: [PokemonGO.Stats, PokemonGO.Stats] = givenLevels
			? [
					{ atk: 0, def: 0, sta: 0 },
					{ atk: 15, def: 15, sta: 15 },
				]
			: [
					{ atk: 10, def: 10, sta: 10 },
					{ atk: 15, def: 15, sta: 15 },
				];

		const baseLevelCP = `${getCP(mon.baseStats, levels[0], ivRange[0])}-${getCP(mon.baseStats, levels[0], ivRange[1])} at Lv${levels[0]}`;
		const extraLevelCP = levels[1]
			? ` (${getCP(mon.baseStats, levels[1], ivRange[0])}-${getCP(mon.baseStats, levels[1], ivRange[1])} at Lv${levels[1]})`
			: null;
		broadcast(
			`${mon.name} can have a CP of ${baseLevelCP}${extraLevelCP ?? ''}, and ${mon.shiny ? 'can' : 'cannot'} be shiny.` as ToTranslate
		);
	},
};
