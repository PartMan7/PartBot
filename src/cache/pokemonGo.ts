import { FlatCache } from 'flat-cache';
import SheetsParser from 'sheets-parser';

import { IS_ENABLED } from '@/enabled';
import { fsPath } from '@/utils/fsPath';

// eslint-disable-next-line @typescript-eslint/no-namespace -- Looks better with dot notation
export namespace PokemonGO {
	export type Stats = {
		atk: number;
		def: number;
		sta: number;
	};

	export type Pokemon = {
		_id: string;
		name: string;
		num: number;
		types: string[];
		baseStats: Stats;
		heightm: number;
		weightkg: number;
		prevo?: string;
		evos?: string[];
		moves: Record<'fast' | 'fast_elite' | 'charged' | 'charged_elite', string[]>;
		shiny: boolean;
		shinyLocked?: boolean;
		unreleased?: boolean;
	};

	export type FastMove = {
		_id: string;
		name: string;
		pvp: { energy: number; power: number; turns: number; eps: number; dps: number };
		pve: { energy: number; power: number; duration: number; delay: number; eps: number; dps: number };
		type: string;
	};

	export type ChargedMove = {
		_id: string;
		name: string;
		pvp: {
			energy: number;
			power: number;
			dpe: number;
			boost?: { chance?: number; stats?: [selfAtk: number, selfDef: number, oppAtk: number, oppDef: number] };
		};
		pve: {
			energy: number;
			power: number;
			duration: number;
			delay: number;
			dpe: number;
			d2pes: number;
		};
		type: string;
		desc: string;
	};
}

const client = IS_ENABLED.SHEETS ? SheetsParser(process.env.SHEETS_API_KEY) : null;
const POKEMON_GO_SOURCE_SHEET_ID = '1cSm11AfVmMrRIAxDzzCc_G7mFjtIYY0rXRRweZEyEyo';

export const GOData: {
	pokedex: Record<string, PokemonGO.Pokemon>;
	fastMoves: Record<string, PokemonGO.FastMove>;
	chargedMoves: Record<string, PokemonGO.ChargedMove>;
} = {
	pokedex: {},
	fastMoves: {},
	chargedMoves: {},
};

const cacheId = 'go.json';
const flatCache = new FlatCache({ cacheId: cacheId, cacheDir: fsPath('cache', 'flat-cache') });
flatCache.load(cacheId);

const cachedPokedex = flatCache.get<Record<string, PokemonGO.Pokemon> | undefined>('pokedex');
if (cachedPokedex) GOData.pokedex = cachedPokedex;
const cachedFastMoves = flatCache.get<Record<string, PokemonGO.FastMove> | undefined>('fastMoves');
if (cachedFastMoves) GOData.fastMoves = cachedFastMoves;
const cachedChargedMoves = flatCache.get<Record<string, PokemonGO.ChargedMove> | undefined>('chargedMoves');
if (cachedChargedMoves) GOData.chargedMoves = cachedChargedMoves;

export async function updatePokemonGOCache(): Promise<void> {
	if (!client) throw new Error('Reading data from Google Sheets is disabled.');
	const data = await client.getDataFromSheet<{
		pokedex: Record<string, PokemonGO.Pokemon>;
		fast_moves: Record<string, PokemonGO.FastMove>;
		charged_moves: Record<string, PokemonGO.ChargedMove>;
	}>(POKEMON_GO_SOURCE_SHEET_ID, ['#pokedex', '#fast_moves', '#charged_moves']);

	flatCache.set('pokedex', data.pokedex);
	flatCache.set('fastMoves', data.fast_moves);
	flatCache.set('chargedMoves', data.charged_moves);

	GOData.pokedex = data.pokedex;
	GOData.fastMoves = data.fast_moves;
	GOData.chargedMoves = data.charged_moves;

	flatCache.save();
}
