/**
 * Battle system type definitions.
 * Uses types from ps-client where applicable.
 */

import { formats } from 'ps-client/data';

import { toId } from '@/utils/toId';

// Re-export ps-client types (alphabetically ordered)
export type { Ability as PSAbility, Item as PSItem, Species as PSSpecies, Types as TypeName } from 'ps-client/data';

// Import Types for local use
import type { Types } from 'ps-client/data';

// ============ Format Configuration ============

export interface FormatConfig {
	id: string;
	generation: number;
	isRandom: boolean;
	hasTeamPreview: boolean;
	teamSize: number;
	pickedTeamSize?: number | undefined;
}

/**
 * Parse format configuration from ps-client formats data.
 */
function parseFormats(): Record<string, FormatConfig> {
	const result: Record<string, FormatConfig> = {};

	for (const entry of formats) {
		if ('section' in entry) continue; // Skip section headers

		const format = entry;
		if (!format.name) continue;

		const id = toId(format.name);
		const genMatch = id.match(/gen(\d)/);
		const generation = genMatch ? parseInt(genMatch[1]) : 9;
		const isRandom = id.includes('random');
		const isDoubles = format.gameType === 'doubles';

		result[id] = {
			id,
			generation,
			isRandom,
			hasTeamPreview: !isRandom && format.ruleset?.includes('Team Preview') !== false,
			teamSize: 6,
			pickedTeamSize: isDoubles ? 4 : 6,
		};
	}

	return result;
}

export const FORMATS: Record<string, FormatConfig> = parseFormats();

// ============ Pokemon Types ============

export type StatId = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';
export type BoostId = 'atk' | 'def' | 'spa' | 'spd' | 'spe' | 'accuracy' | 'evasion';
export type Stats = Record<StatId, number>;
export type Boosts = Partial<Record<BoostId, number>>;

export type StatusId = 'brn' | 'par' | 'slp' | 'frz' | 'psn' | 'tox' | 'fnt';

// ============ Pokemon State ============

export interface Pokemon {
	// Identity
	species: string;
	speciesId: string;
	level: number;
	gender: 'M' | 'F' | 'N' | null;
	shiny?: boolean;

	// Types (known once species is revealed)
	types: Types[];

	// Current state
	hp: number; // 0-1 normalized for opponent, absolute for our team
	maxHp: number | null; // Only known for our team
	status: StatusId | null;
	statusTurns?: number;
	boosts: Boosts;
	volatiles: Set<string>;

	// Known information (revealed during battle)
	knownMoves: string[];
	knownAbility: string | null;
	knownItem: string | null;
	itemConsumed: boolean;
	terastallized: Types | null;
	dynamaxed: boolean;

	// Full information (only for our side)
	moves?: string[];
	ability?: string;
	item?: string | undefined;
	stats?: Stats | undefined;
	teraType?: Types | undefined;

	// Battle position
	active: boolean;
	fainted: boolean;
	slot: number;
}

// ============ Side State ============

export interface Hazards {
	stealthRock: boolean;
	spikes: number; // 0-3
	toxicSpikes: number; // 0-2
	stickyWeb: boolean;
}

export interface Screens {
	reflect: number; // Turns remaining
	lightScreen: number;
	auroraVeil: number;
}

export interface Side {
	name: string;
	odentifier: 'p1' | 'p2';
	active: Pokemon | null;
	team: Pokemon[];
	teamSize: number;
	faintedCount: number;
	totalPokemon: number;

	hazards: Hazards;
	screens: Screens;
	tailwind: number;
	wish: { hp: number; turns: number } | null;
}

// ============ Field State ============

export type Weather = 'sun' | 'rain' | 'sand' | 'snow' | 'hail' | 'harshsun' | 'heavyrain' | 'strongwinds' | null;
export type Terrain = 'electric' | 'grassy' | 'misty' | 'psychic' | null;

export interface Field {
	weather: Weather;
	weatherTurns: number;
	terrain: Terrain;
	terrainTurns: number;
	trickRoom: number;
	gravity: number;
	magicRoom: number;
	wonderRoom: number;
}

// ============ Battle State ============

export type BattlePhase = 'teamPreview' | 'active' | 'forceSwitch' | 'waiting' | 'ended';

export interface BattleState {
	format: FormatConfig;
	turn: number;
	phase: BattlePhase;

	p1: Side;
	p2: Side;
	field: Field;

	// Metadata
	roomId: string;
	startedAt: Date;
	ourSide: 'p1' | 'p2';
	rqid: number;
}

// ============ Actions ============

export type Action = MoveAction | SwitchAction | TeamAction | PassAction;

export interface MoveAction {
	type: 'move';
	slot: number; // 1-4
	moveId: string;
	target?: number;
	mega?: boolean;
	zmove?: boolean;
	dynamax?: boolean;
	terastallize?: boolean;
}

export interface SwitchAction {
	type: 'switch';
	slot: number; // 1-6
	pokemonName: string;
}

export interface TeamAction {
	type: 'team';
	order: number[]; // Lead order
}

export interface PassAction {
	type: 'pass';
}

// ============ Request Types ============

export interface BattleRequest {
	requestType: 'move' | 'switch' | 'teamPreview' | 'wait';
	rqid: number;

	active?: ActiveRequest[] | undefined;
	side?: SideRequest | undefined;
	forceSwitch?: boolean[] | undefined;

	teamPreview?: boolean | undefined;
	maxTeamSize?: number | undefined;
}

export interface ActiveRequest {
	moves: MoveRequest[];
	trapped?: boolean;
	maybeTrapped?: boolean;
	canMegaEvo?: boolean;
	canUltraBurst?: boolean;
	canZMove?: (ZMoveRequest | null)[];
	canDynamax?: boolean;
	maxMoves?: { maxMoves: MaxMoveRequest[] };
	canTerastallize?: Types;
}

export interface MoveRequest {
	move: string;
	id: string;
	pp: number;
	maxpp: number;
	disabled?: boolean;
	disabledSource?: string;
	target?: string;
}

export interface ZMoveRequest {
	move: string;
	target: string;
}

export interface MaxMoveRequest {
	move: string;
	target: string;
}

export interface SideRequest {
	name: string;
	id: 'p1' | 'p2';
	pokemon: SidePokemon[];
}

export interface SidePokemon {
	ident: string;
	details: string;
	condition: string;
	active: boolean;
	moves: string[];
	baseAbility: string;
	ability: string;
	item: string;
	pokeball: string;
	stats: Stats;
	teraType?: Types | undefined;
}

// ============ Decision Engine Types ============

export interface DecisionContext {
	state: BattleState;
	request: BattleRequest;
	legalActions: Action[];
	/** Seeded RNG function for deterministic decisions */
	RNG: () => number;
}

export interface DecisionResult {
	action: Action;
	confidence?: number | undefined;
	reasoning?: string | undefined;
}

// ============ AI Level ============

export type AILevel = 0 | 1 | 2;
