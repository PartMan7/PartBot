import { HSL as hslFromTools } from 'ps-client/tools';

import type { Datacenters } from 'ps-client/data';

export type { Ability, Item, Move, Species } from 'ps-client/data';

export const abilities: Datacenters['abilities'] = {};
export const aliases: Datacenters['aliases'] = {};
export const formatsData: Datacenters['formatsData'] = {};
export const formats: Datacenters['formats'] = [];
export const items: Datacenters['items'] = {};
export const learnsets: Datacenters['learnsets'] = {};
export const moves: Datacenters['moves'] = {};
export const pokedex: Datacenters['pokedex'] = {};
export const typechart: Datacenters['typechart'] = {} as Datacenters['typechart'];
export const colors: Datacenters['colors'] = {};

const tables: Record<keyof Omit<Datacenters, 'formats' | 'colors'>, Record<string, unknown>> = {
	abilities,
	aliases,
	formatsData,
	items,
	learnsets,
	moves,
	pokedex,
	typechart,
};

function inplaceReplace(target: Record<string, unknown>, source: Record<string, unknown>) {
	for (const key of Object.keys(target)) delete target[key];
	Object.assign(target, source);
}

export function applyPSDatacenters(data: Partial<Datacenters>) {
	for (const [key, value] of Object.entries(data) as [keyof Datacenters, Datacenters[keyof Datacenters]][]) {
		if (key === 'formats') {
			formats.length = 0;
			formats.push(...(value as Datacenters['formats']));
		} else if (key === 'colors') {
			inplaceReplace(colors, value as Record<string, unknown>);
		} else {
			inplaceReplace(tables[key as keyof typeof tables], value as Record<string, unknown>);
		}
	}
}

export function datacentersLoaded() {
	return Object.keys(pokedex).length > 0;
}

export async function ensurePSDatacenters() {
	if (datacentersLoaded()) return;
	const { updateShowdownData } = await import('@/cache/showdown');
	const { ShowdownDataKeys } = await import('@/cache/showdown/types');
	await updateShowdownData([ShowdownDataKeys.PSDatacenters]);
}

export function psHSL(name: string, opts?: { original?: boolean }) {
	return hslFromTools(name, { ...opts, customColors: colors });
}
