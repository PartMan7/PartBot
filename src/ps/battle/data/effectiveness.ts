/**
 * Type effectiveness calculation.
 * Uses typechart data from ps-client.
 */

import { moves, typechart } from 'ps-client/data';

import { toId } from '@/utils/toId';

import type { TypeName } from '@/ps/battle/types';

/**
 * Convert damageTaken value to multiplier.
 * ps-client format: 0 = neutral (1x), 1 = super effective (2x), 2 = resistant (0.5x), 3 = immune (0x)
 */
function damageTakenToMultiplier(value: number): number {
	switch (value) {
		case 1:
			return 2;
		case 2:
			return 0.5;
		case 3:
			return 0;
		default:
			return 1;
	}
}

/**
 * Get type effectiveness multiplier for an attack type against defense types.
 */
export function getEffectiveness(attackType: TypeName, defenseTypes: TypeName[]): number {
	let multiplier = 1;

	for (const defType of defenseTypes) {
		const defTypeId = toId(defType) as Lowercase<TypeName>;
		const typeData = typechart[defTypeId];

		if (typeData) {
			const damageTaken = typeData.damageTaken[attackType];
			if (typeof damageTaken === 'number') {
				multiplier *= damageTakenToMultiplier(damageTaken);
			}
		}
	}

	return multiplier;
}

/**
 * Get type effectiveness multiplier against a Pokemon by species name.
 * Uses the Pokemon data module to look up types.
 */
export function getEffectivenessVsPokemon(attackType: TypeName | keyof typeof moves, pokemonTypes: TypeName[]): number {
	const typeId = toId(attackType);
	if (typeId in moves) return getEffectiveness(moves[typeId].type, pokemonTypes);
	return getEffectiveness(attackType as TypeName, pokemonTypes);
}

/**
 * Check if a type is immune to another type.
 */
export function isImmune(attackType: TypeName | keyof typeof moves, defenseTypes: TypeName[]): boolean {
	return getEffectivenessVsPokemon(attackType, defenseTypes) === 0;
}

/**
 * Check if a type is super effective.
 */
export function isSuperEffective(attackType: TypeName | keyof typeof moves, defenseTypes: TypeName[]): boolean {
	return getEffectivenessVsPokemon(attackType, defenseTypes) > 1;
}

/**
 * Check if a type is not very effective.
 */
export function isResisted(attackType: TypeName | keyof typeof moves, defenseTypes: TypeName[]): boolean {
	const eff = getEffectivenessVsPokemon(attackType, defenseTypes);
	return eff > 0 && eff < 1;
}
