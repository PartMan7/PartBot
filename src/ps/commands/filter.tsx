import { abilities, items, moves, pokedex } from 'ps-client/data';

import { toId } from '@/tools';
import { ChatError } from '@/utils/chatError';

import type { ToTranslate } from '@/i18n/types';
import type { PSCommand } from '@/types/chat';
import type { ReactElement } from 'react';

function List({ items }: { items: string[] }): ReactElement {
	return (
		<div className="infobox">
			<details>
				<summary>{items.length} Match(es)</summary>
				<hr />
				{items.space(<br />)}
			</details>
		</div>
	);
}

const filterTypes: {
	name: string;
	initial: string;
	aliases: string[];
	entries: { id: string; name: string }[];
}[] = [
	{
		name: 'abilities',
		initial: 'a',
		aliases: ['abilities', 'ability'],
		sources: [abilities],
	},
	{
		name: 'items',
		initial: 'i',
		aliases: ['items', 'item'],

		sources: [items],
	},
	{
		name: 'moves',
		initial: 'm',
		aliases: ['moves', 'move'],
		sources: [moves],
	},
	{
		name: 'pokedex',
		initial: 'n',
		aliases: ['dex', 'names', 'name'],
		sources: [pokedex],
	},

	{
		name: 'all',
		initial: '',
		aliases: ['all'],
		sources: [abilities, items, moves, pokedex],
	},
].map(type => ({
	...type,
	entries: type.sources.flatMap(source => {
		return Object.values(source).map(entry => ({
			name: entry.name,
			id: 'id' in entry ? entry.id : toId(entry.name),
		}));
	}),
}));

export const command: PSCommand[] = Object.values(filterTypes).map(({ initial, aliases, entries }) => ({
	name: `filter${aliases[0]}`,
	help: 'Filter matching entries (by RegEx). See https://regexone.com for help.',
	syntax: 'CMD [pattern]',
	flags: { pmOnly: true },
	aliases: [...aliases.slice(1), `f${initial}`],
	async run({ message, $T, arg }) {
		const basePattern = arg.trim();
		if (!basePattern) throw new ChatError($T('INVALID_ARGUMENTS'));
		let pattern: RegExp;
		try {
			pattern = new RegExp(basePattern, 'i');
		} catch {
			throw new ChatError('Invalid regular expression. Try https://regex101.com for help.' as ToTranslate);
		}

		const matchedEntries = entries
			.filter(entry => pattern.test(entry.id))
			.map(entry => entry.name)
			.sort();

		message.replyHTML(matchedEntries.length > 0 ? <List items={matchedEntries} /> : 'Results: 0');
	},
}));
