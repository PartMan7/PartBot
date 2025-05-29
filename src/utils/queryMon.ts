import { type Species, pokedex } from 'ps-client/data';

import { toId } from '@/tools';

export function queryMon(input: string): Species | null {
	const id = toId(input);
	const formeNames = {
		alola: ['a', 'alola', 'alolan'],
		galar: ['g', 'galar', 'galarian'],
		mega: ['m', 'mega'],
		primal: ['p', 'primal'],
	};
	const alts: string[] = [id];
	Object.entries(formeNames).forEach(([key, values]) => {
		values.forEach(val => {
			if (id.startsWith(val)) alts.push(id.slice(0, val.length) + key);
			if (id.endsWith(val)) alts.push(id.slice(0, -val.length) + key);
		});
	});

	return alts.map(alt => pokedex[alt]).find(Boolean) ?? null;
}
