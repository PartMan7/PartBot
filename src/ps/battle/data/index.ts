/**
 * Pokemon data access layer.
 * Uses ps-client for Pokemon data (moves, abilities, species).
 */

import { abilities, items, moves, pokedex } from 'ps-client/data';

import { toId } from '@/utils/toId';

import type { Types } from 'ps-client/data';

// Re-export effectiveness utilities
export { getEffectiveness, getEffectivenessVsPokemon, isImmune, isResisted, isSuperEffective } from '@/ps/battle/data/effectiveness';

// ============ Species Data ============

export interface SpeciesData {
	name: string;
	id: string;
	types: Types[];
	baseStats: {
		hp: number;
		atk: number;
		def: number;
		spa: number;
		spd: number;
		spe: number;
	};
	abilities: string[];
	weightkg: number;
}

/**
 * Get species data by name or ID.
 * Note: ps-client data is not generation-specific, so gen parameter is ignored.
 */
export function getSpecies(name: string, _gen?: number): SpeciesData | null {
	const id = toId(name);
	const species = pokedex[id];

	if (!species) {
		return null;
	}

	const abilityList: string[] = [];
	if (species.abilities[0]) abilityList.push(species.abilities[0]);
	if (species.abilities[1]) abilityList.push(species.abilities[1]);
	if (species.abilities.H) abilityList.push(species.abilities.H);
	if (species.abilities.S) abilityList.push(species.abilities.S);

	return {
		name: species.name,
		id: species.id,
		types: species.types,
		baseStats: { ...species.baseStats },
		abilities: abilityList,
		weightkg: species.weightkg,
	};
}

/**
 * Get types for a species.
 */
export function getSpeciesTypes(name: string, _gen?: number): Types[] {
	const species = getSpecies(name);
	return species?.types ?? [];
}

// ============ Move Data ============

export interface MoveData {
	name: string;
	id: string;
	type: Types;
	category: 'Physical' | 'Special' | 'Status';
	basePower: number;
	accuracy: number | true;
	pp: number;
	priority: number;
	target: string;
	flags: Record<string, number>;
	// Boost effects
	boosts?: Partial<Record<string, number>> | undefined;
	selfBoost?: { boosts: Partial<Record<string, number>> } | undefined;
	secondary?:
		| {
				chance?: number | undefined;
				boosts?: Partial<Record<string, number>> | undefined;
				self?: { boosts?: Partial<Record<string, number>> | undefined } | undefined;
				status?: string | undefined;
				volatileStatus?: string | undefined;
		  }
		| undefined;
	// Special properties
	drain?: [number, number] | undefined;
	recoil?: [number, number] | undefined;
	heal?: number[] | null | undefined;
	volatileStatus?: string | undefined;
	sideCondition?: string | undefined;
	weather?: string | undefined;
	terrain?: string | undefined;
	pseudoWeather?: string | undefined;
	forceSwitch?: boolean | undefined;
	selfSwitch?: boolean | string | undefined;
	hasCrashDamage?: boolean | undefined;
	mindBlownRecoil?: boolean | undefined;
	stealsBoosts?: boolean | undefined;
	breaksProtect?: boolean | undefined;
	willCrit?: boolean | undefined;
	ohko?: boolean | string | undefined;
}

/**
 * Get move data by name or ID.
 * Note: ps-client data is not generation-specific, so gen parameter is ignored.
 */
export function getMove(name: string, _gen?: number): MoveData | null {
	const id = toId(name);
	const move = moves[id];

	if (!move) {
		return null;
	}

	return {
		name: move.name,
		id,
		type: move.type,
		category: move.category,
		basePower: move.basePower,
		accuracy: move.accuracy,
		pp: move.pp,
		priority: move.priority,
		target: move.target,
		flags: { ...move.flags },
		boosts: move.boosts ? { ...move.boosts } : undefined,
		selfBoost: move.selfBoost ? { boosts: { ...move.selfBoost.boosts } } : undefined,
		secondary: move.secondary
			? {
					chance: move.secondary.chance,
					boosts: move.secondary.boosts ? { ...move.secondary.boosts } : undefined,
					self: move.secondary.self
						? { boosts: move.secondary.self.boosts ? { ...move.secondary.self.boosts } : undefined }
						: undefined,
					status: move.secondary.status,
					volatileStatus: move.secondary.volatileStatus,
				}
			: undefined,
		drain: move.drain,
		recoil: move.recoil,
		heal: move.heal,
		volatileStatus: move.volatileStatus,
		sideCondition: move.sideCondition,
		weather: move.weather,
		terrain: move.terrain,
		pseudoWeather: move.pseudoWeather,
		forceSwitch: move.forceSwitch,
		selfSwitch: move.selfSwitch,
		hasCrashDamage: move.hasCrashDamage,
		mindBlownRecoil: move.mindBlownRecoil,
		stealsBoosts: move.stealsBoosts,
		breaksProtect: move.breaksProtect,
		willCrit: move.willCrit,
		ohko: move.ohko,
	};
}

/**
 * Check if a move is a status move.
 */
export function isStatusMove(name: string, _gen?: number): boolean {
	const move = getMove(name);
	return move?.category === 'Status';
}

/**
 * Check if a move is a hazard-setting move.
 */
export function isHazardMove(name: string): boolean {
	const id = toId(name);
	return ['stealthrock', 'spikes', 'toxicspikes', 'stickyweb'].includes(id);
}

/**
 * Check if a move is a recovery move.
 */
export function isRecoveryMove(name: string, _gen?: number): boolean {
	const move = getMove(name);
	if (!move) return false;
	return !!move.heal || !!move.drain;
}

// ============ Ability Data ============

export interface AbilityData {
	name: string;
	id: string;
	desc?: string | undefined;
	shortDesc?: string | undefined;
}

/**
 * Get ability data by name or ID.
 */
export function getAbility(name: string, _gen?: number): AbilityData | null {
	const id = toId(name);
	const ability = abilities[id];

	if (!ability) {
		return null;
	}

	return {
		name: ability.name,
		id,
		desc: ability.desc,
		shortDesc: ability.shortDesc,
	};
}

/**
 * Check if an ability grants Ground immunity.
 */
export function grantsGroundImmunity(abilityName: string | null): boolean {
	if (!abilityName) return false;
	const id = toId(abilityName);
	return id === 'levitate';
}

/**
 * Check if an ability is Adaptability (boosts STAB).
 */
export function isAdaptability(abilityName: string | null): boolean {
	if (!abilityName) return false;
	return toId(abilityName) === 'adaptability';
}

// ============ Item Data ============

export interface ItemData {
	name: string;
	id: string;
	desc?: string | undefined;
	shortDesc?: string | undefined;
	isBerry?: boolean | undefined;
	isChoice?: boolean | undefined;
}

/**
 * Get item data by name or ID.
 */
export function getItem(name: string): ItemData | null {
	const id = toId(name);
	const item = items[id];

	if (!item) {
		return null;
	}

	return {
		name: item.name,
		id,
		desc: item.desc,
		shortDesc: item.shortDesc,
		isBerry: item.isBerry,
		isChoice: item.isChoice,
	};
}

/**
 * Check if an item grants Ground immunity.
 */
export function itemGrantsGroundImmunity(itemName: string | null): boolean {
	if (!itemName) return false;
	return toId(itemName) === 'airballoon';
}

/**
 * Check if an item is a choice item.
 */
export function isChoiceItem(itemName: string | null): boolean {
	if (!itemName) return false;
	const item = getItem(itemName);
	return item?.isChoice ?? false;
}

/**
 * Check if an item boosts a specific type's moves.
 */
export function getItemTypeBoost(itemName: string | null): Types | null {
	if (!itemName) return null;
	const id = toId(itemName);

	const typeBoostItems: Record<string, Types> = {
		silkscarf: 'Normal',
		charcoal: 'Fire',
		mysticwater: 'Water',
		magnet: 'Electric',
		miracleseed: 'Grass',
		nevermeltice: 'Ice',
		blackbelt: 'Fighting',
		poisonbarb: 'Poison',
		softsand: 'Ground',
		sharpbeak: 'Flying',
		twistedspoon: 'Psychic',
		silverpowder: 'Bug',
		hardstone: 'Rock',
		spelltag: 'Ghost',
		dragonfang: 'Dragon',
		blackglasses: 'Dark',
		metalcoat: 'Steel',
		fairyfeather: 'Fairy',
	};

	return typeBoostItems[id] ?? null;
}
