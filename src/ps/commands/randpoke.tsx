import { GOData } from '@/cache/pokemonGo';
import { prefix } from '@/config/ps';
import { ChatError } from '@/utils/chatError';
import { PSIcon } from '@/utils/components/ps/psicon';
import { toId } from '@/utils/toId';

import type { PokemonGO } from '@/cache/pokemonGo';
import type { NoTranslate, TranslationFn } from '@/i18n/types';
import type { PSCommand } from '@/types/chat';

const NORMALIZED_MONS = {
	pikachu: 'Pikachu',
	unown: 'Unown-A',
	castform: 'Castform',
	wormadam: 'Wormadam-Plant',
	arceus: 'Arceus',
	pumpkaboo: 'Pumpkaboo',
	gourgeist: 'Gourgeist',
	silvally: 'Silvally',
};
function isBaseMon(mon: string): boolean {
	const forme = toId(mon.split('-')[0]);
	if (!(forme in NORMALIZED_MONS)) return true;
	return NORMALIZED_MONS[forme as keyof typeof NORMALIZED_MONS] === mon;
}

type RandpokeGOOpts = { count: number; type?: string; fe?: boolean; ur?: boolean };

function parseGOArgs(arg: string): RandpokeGOOpts {
	let count = 1;
	let type: string | undefined;
	let fe = false;
	let ur = false;
	const knownTypes = [...new Set(Object.values(GOData.pokedex).flatMap(mon => mon.types))];

	for (const token of arg
		.trim()
		.split(/\s*,\s*/)
		.filter(Boolean)) {
		if (/^\d+$/.test(token)) {
			const n = +token;
			if (n < 1 || n > 12) throw new ChatError(`${token} is not a valid count.` as NoTranslate);
			count = n;
		} else if (toId(token) === 'fe') {
			fe = true;
		} else if (toId(token) === 'ur') {
			ur = true;
		} else {
			const match = knownTypes.find(t => toId(t) === toId(token));
			if (!match) throw new ChatError(`${token} is not a recognized Pokémon type.` as NoTranslate);
			type = match;
		}
	}
	return { count, ...(type ? { type } : {}), ...(fe ? { fe } : {}), ...(ur ? { ur } : {}) };
}

function goPool(opts: RandpokeGOOpts, $T: TranslationFn): PokemonGO.Pokemon[] {
	const pool = Object.values(GOData.pokedex).filter(mon => {
		if (!opts.ur && mon.unreleased) return false;
		if (opts.type && !mon.types.includes(opts.type)) return false;
		if (opts.fe && mon.evos?.length) return false;
		if (!isBaseMon(mon.name)) return false;
		return true;
	});
	if (!pool.length) throw new ChatError($T('ENTRY_NOT_FOUND'));
	return pool.sample(opts.count);
}

export const command: PSCommand = {
	name: 'randpoke',
	help: {
		pokemongo: 'Shows data for random Pokémon GO Pokémon.',
		default: 'Starts a Smogon randpoke param search.',
	},
	syntax: {
		pokemongo: 'CMD [type?], [count?], [FE?], [UR?]',
		default: 'CMD',
	},
	rooms: ['scavengers', 'indonesia', 'pokemongo', 'botdevelopment'],
	perms: 'voice',
	categories: ['casual'],
	async run({ message, arg, run, broadcastHTML, $T }) {
		switch (message.type === 'chat' ? message.target.id : null) {
			case 'pokemongo':
			case 'botdevelopment': {
				const selected = goPool(parseGOArgs(arg), $T);
				if (selected.length === 1) return run(`dt ${toId(selected[0].name)}`);

				const cmdLabel = `${prefix}randpoke${arg.trim() ? ` ${arg.trim()}` : ''}:`;
				return broadcastHTML(
					<div className="infobox">
						<span className="gray">{cmdLabel}</span>
						<br />
						{selected
							.map(mon => {
								const id = toId(mon.name);
								return (
									<a
										href={`//dex.pokemonshowdown.com/pokemon/${id}`}
										target="_blank"
										className="subtle"
										style={{ whiteSpace: 'nowrap' }}
										rel="noopener"
									>
										<PSIcon pokemon={id} />
										{mon.name}
									</a>
								);
							})
							.space(', ')}
					</div>
				);
			}
			default:
				message.reply('!randpoke 2, FE, NatDex' as NoTranslate);
		}
	},
};
