/**
 * Pokemon Showdown battle protocol parser.
 * Parses battle messages and updates battle state.
 */

import { Battle } from '@/ps/battle/battle';
import { getSpeciesTypes } from '@/ps/battle/data';
import {
	type ActiveRequest,
	type BattleRequest,
	type BattleState,
	type BoostId,
	FORMATS,
	type Pokemon,
	type Side,
	type SidePokemon,
	type StatusId,
	type Terrain,
	type TypeName,
	type Weather,
} from '@/ps/battle/types';
import { getBattleManager } from '@/ps/handlers/battle';
import { mapValues } from '@/utils/map';
import { toId } from '@/utils/toId';

import type { Client } from 'ps-client';

const BattleProtocolEvents: Record<string, (state: BattleState, args: string[], battle: Battle) => void> = {
	request: (state, args, battle) => {
		battle.handleRequest(args.join('|')).then(command => {
			if (command) {
				battle.send(`/choose ${command}`);
			}
		});
	},

	player: parsePlayer,
	teamsize: parseTeamSize,
	// gametype: parseGameType,
	gen: (state, args) => {
		state.format.generation = parseInt(args[0]) || state.format.generation;
	},
	tier: (_state, _args) => {
		// state.format.name = args[0];
	},
	rule: (_state, _args) => {
		// state.format.rules = args[0];
	},
	start: (state, _args) => {
		state.phase = 'active';
	},
	turn: (state, args) => {
		state.turn = parseInt(args[0]) || state.turn;
	},

	// Pokemon actions
	switch: parseSwitch,
	drag: parseSwitch,
	move: parseMove,
	detailschange: parseDetailsChange,
	'-formechange': parseDetailsChange,
	'-damage': parseDamage,
	'-heal': parseHeal,
	'-status': parseStatus,
	'-curestatus': parseCureStatus,
	'-cureteam': parseCureTeam,

	'-boost': (state, args) => parseBoost(state, args, 1),
	'-unboost': (state, args) => parseBoost(state, args, -1),
	'-setboost': (state, args) => parseSetBoost(state, args),
	'-clearboost': parseClearBoost,
	'-copyboost': parseCopyBoost,
	'-invertboost': parseInvertBoost,
	'-swapboost': parseSwapBoost,
	'-ability': parseAbility,
	'-endability': parseEndAbility,
	'-item': parseItem,
	'-enditem': parseEndItem,
	'-weather': parseWeather,
	'-fieldstart': parseFieldStart,
	'-fieldend': parseFieldEnd,
	'-sidestart': parseSideStart,
	'-sideend': parseSideEnd,
	'-start': parseVolatileStart,
	'-end': parseVolatileEnd,
	'-mega': parseMega,
	'-burst': parseMega,
	'-terastallize': parseTerastallize,
	faint: parseFaint,
	win: (state, _args) => {
		state.phase = 'ended';
	},
	tie: (state, _args) => {
		state.phase = 'ended';
	},
	'-transform': parseTransform,
};

/**
 * Register battle events for the PS client.
 * @param PS - The PS client instance.
 * @returns A function to unregister the events.
 */
export function registerBattleEvents(PS: Client): () => void {
	const eventsList = mapValues(BattleProtocolEvents, (handler, event) => {
		return {
			event,
			callback: (room: string, line: string, isIntro: boolean) => {
				if (isIntro) return;
				if (!room.startsWith('battle-')) return;
				const battle = getBattleManager()!.getBattle(room);
				if (!battle) return;
				handler(battle.state, line.split('|'), battle);
			},
		};
	});

	PS.on('updatesearch', onUpdateSearch);
	for (const event in eventsList) {
		PS.on(event, eventsList[event].callback);
	}

	return () => {
		PS.off('updatesearch', onUpdateSearch);
		for (const event in eventsList) {
			PS.off(event, eventsList[event].callback);
		}
	};
}

// |updatesearch|{"searching":[],"games":{"battle-gen9randombattle-2513365049":"[Gen 9] Random Battle"}}
function onUpdateSearch(this: Client, room: string, line: string): void {
	const { games } = JSON.parse(line) as { searching: string[]; games?: Record<string, string> };
	const manager = getBattleManager()!;
	for (const room in games) {
		const existingBattle = manager.getBattle(room);
		if (existingBattle) continue;
		const formatId = toId(games[room] ?? '');
		if (!formatId || !FORMATS[formatId]) continue;
		const battle = new Battle(manager.client, room, FORMATS[formatId], 'p1', manager.decisionEngine);
		manager.battles.set(room, battle);
	}
}

/**
 * Parse a battle protocol line and update state.
 */
export function ____deprecatedParseProtocolLine(state: BattleState, line: string): void {
	if (!line.startsWith('|')) return;

	const parts = line.slice(1).split('|');
	const cmd = parts[0];
	const args = parts.slice(1);

	switch (cmd) {
		case 'player':
			parsePlayer(state, args);
			break;
		case 'teamsize':
			parseTeamSize(state, args);
			break;
		case 'gametype':
			// Singles, doubles, etc - could track if needed
			break;
		case 'gen':
			state.format.generation = parseInt(args[0]) || state.format.generation;
			break;
		case 'tier':
			// Format name
			break;
		case 'rule':
			// Rules - could track if needed
			break;
		case 'start':
			state.phase = 'active';
			break;
		case 'turn':
			state.turn = parseInt(args[0]) || state.turn;
			break;

		// Pokemon actions
		case 'switch':
		case 'drag':
			parseSwitch(state, args);
			break;
		case 'move':
			parseMove(state, args);
			break;
		case 'detailschange':
		case '-formechange':
			parseDetailsChange(state, args);
			break;

		// Damage/healing
		case '-damage':
			parseDamage(state, args);
			break;
		case '-heal':
			parseHeal(state, args);
			break;

		// Status
		case '-status':
			parseStatus(state, args);
			break;
		case '-curestatus':
			parseCureStatus(state, args);
			break;
		case '-cureteam':
			parseCureTeam(state, args);
			break;

		// Boosts
		case '-boost':
			parseBoost(state, args, 1);
			break;
		case '-unboost':
			parseBoost(state, args, -1);
			break;
		case '-setboost':
			parseSetBoost(state, args);
			break;
		case '-clearboost':
		case '-clearpositiveboost':
		case '-clearnegativeboost':
			parseClearBoost(state, args);
			break;
		case '-copyboost':
			parseCopyBoost(state, args);
			break;
		case '-invertboost':
			parseInvertBoost(state, args);
			break;
		case '-swapboost':
			parseSwapBoost(state, args);
			break;

		// Abilities/items
		case '-ability':
			parseAbility(state, args);
			break;
		case '-endability':
			parseEndAbility(state, args);
			break;
		case '-item':
			parseItem(state, args);
			break;
		case '-enditem':
			parseEndItem(state, args);
			break;

		// Field effects
		case '-weather':
			parseWeather(state, args);
			break;
		case '-fieldstart':
			parseFieldStart(state, args);
			break;
		case '-fieldend':
			parseFieldEnd(state, args);
			break;

		// Side effects
		case '-sidestart':
			parseSideStart(state, args);
			break;
		case '-sideend':
			parseSideEnd(state, args);
			break;

		// Volatile status
		case '-start':
			parseVolatileStart(state, args);
			break;
		case '-end':
			parseVolatileEnd(state, args);
			break;

		// Mega/Dynamax/Tera
		case '-mega':
		case '-burst': // Ultra Burst
			parseMega(state, args);
			break;
		case '-terastallize':
			parseTerastallize(state, args);
			break;

		// Fainting
		case 'faint':
			parseFaint(state, args);
			break;

		// Battle end
		case 'win':
		case 'tie':
			state.phase = 'ended';
			break;

		// Transform/Ditto
		case '-transform':
			parseTransform(state, args);
			break;

		default:
			// Many other messages we don't need to track
			break;
	}
}

// ============ Parse Helpers ============

function getSide(state: BattleState, ident: string): Side {
	return ident.startsWith('p1') ? state.p1 : state.p2;
}

function parseIdent(ident: string): { side: 'p1' | 'p2'; position: string; name: string } {
	// Format: "p1a: Pikachu" or "p2: Pikachu"
	const match = ident.match(/^(p[12])([a-c])?:\s*(.+)$/);
	if (!match) return { side: 'p1', position: 'a', name: ident };
	return {
		side: match[1] as 'p1' | 'p2',
		position: match[2] || 'a',
		name: match[3],
	};
}

function parseDetails(details: string): { species: string; level: number; gender: 'M' | 'F' | null; shiny: boolean } {
	// Format: "Pikachu, L50, M" or "Pikachu, L50, F, shiny"
	const parts = details.split(', ');
	const species = parts[0];
	let level = 100;
	let gender: 'M' | 'F' | null = null;
	let shiny = false;

	for (const part of parts.slice(1)) {
		if (part.startsWith('L')) {
			level = parseInt(part.slice(1)) || 100;
		} else if (part === 'M') {
			gender = 'M';
		} else if (part === 'F') {
			gender = 'F';
		} else if (part === 'shiny') {
			shiny = true;
		}
	}

	return { species, level, gender, shiny };
}

function parseCondition(condition: string): { hp: number; maxHp: number | null; status: StatusId | null } {
	// Format: "100/100" or "75/100 par" or "0 fnt"
	if (condition === '0 fnt') {
		return { hp: 0, maxHp: null, status: 'fnt' };
	}

	const [hpPart, statusPart] = condition.split(' ');
	const [current, max] = hpPart.split('/').map(Number);

	return {
		hp: current,
		maxHp: max || null,
		status: (statusPart as StatusId) || null,
	};
}

function findOrCreatePokemon(side: Side, name: string, gen: number): Pokemon {
	const speciesId = toId(name);
	let pokemon = side.team.find(p => toId(p.species) === speciesId || p.speciesId === speciesId);

	if (!pokemon) {
		const types = getSpeciesTypes(name, gen);
		pokemon = {
			species: name,
			speciesId,
			level: 100,
			gender: null,
			types: types as TypeName[],
			hp: 1,
			maxHp: null,
			status: null,
			boosts: {},
			volatiles: new Set(),
			knownMoves: [],
			knownAbility: null,
			knownItem: null,
			itemConsumed: false,
			terastallized: null,
			dynamaxed: false,
			active: false,
			fainted: false,
			slot: side.team.length,
		};
		side.team.push(pokemon);
	}

	return pokemon;
}

// ============ Individual Parsers ============

function parsePlayer(state: BattleState, args: string[]): void {
	const [playerId, name] = args;
	if (playerId === 'p1') {
		state.p1.name = name;
	} else if (playerId === 'p2') {
		state.p2.name = name;
	}
}

function parseTeamSize(state: BattleState, args: string[]): void {
	const [playerId, size] = args;
	const teamSize = parseInt(size) || 6;
	if (playerId === 'p1') {
		state.p1.teamSize = teamSize;
		state.p1.totalPokemon = teamSize;
	} else if (playerId === 'p2') {
		state.p2.teamSize = teamSize;
		state.p2.totalPokemon = teamSize;
	}
}

function parseSwitch(state: BattleState, args: string[]): void {
	const [ident, details, condition] = args;
	const { side: sideId } = parseIdent(ident);
	const side = getSide(state, ident);
	const { species, level, gender, shiny } = parseDetails(details);
	const { hp, maxHp, status } = parseCondition(condition);

	// Deactivate previous active
	if (side.active) {
		side.active.active = false;
		// Clear volatile statuses on switch
		side.active.boosts = {};
		side.active.volatiles.clear();
	}

	// Find or create pokemon
	const pokemon = findOrCreatePokemon(side, species, state.format.generation);
	pokemon.species = species;
	pokemon.speciesId = toId(species);
	pokemon.level = level;
	pokemon.gender = gender;
	pokemon.shiny = shiny;

	// Update types if species changed
	const types = getSpeciesTypes(species, state.format.generation);
	if (types.length) {
		pokemon.types = types as TypeName[];
	}

	// Determine if we have absolute HP or percentage
	if (sideId === state.ourSide) {
		pokemon.hp = hp;
		pokemon.maxHp = maxHp;
	} else {
		// Opponent - HP is shown as percentage (0-100)
		pokemon.hp = hp / 100;
		pokemon.maxHp = null;
	}

	pokemon.status = status;
	pokemon.active = true;
	pokemon.fainted = status === 'fnt';
	pokemon.boosts = {};
	pokemon.volatiles.clear();
	pokemon.dynamaxed = false;

	side.active = pokemon;
}

function parseMove(state: BattleState, args: string[]): void {
	const [ident, moveName] = args;
	const side = getSide(state, ident);
	const pokemon = side.active;

	if (pokemon) {
		const moveId = toId(moveName);
		if (!pokemon.knownMoves.includes(moveId)) {
			pokemon.knownMoves.push(moveId);
		}
	}
}

function parseDetailsChange(state: BattleState, args: string[]): void {
	const [ident, details] = args;
	const side = getSide(state, ident);
	const { species } = parseDetails(details);

	if (side.active) {
		side.active.species = species;
		side.active.speciesId = toId(species);
		const types = getSpeciesTypes(species, state.format.generation);
		if (types.length) {
			side.active.types = types as TypeName[];
		}
	}
}

function parseDamage(state: BattleState, args: string[]): void {
	const [ident, condition] = args;
	const side = getSide(state, ident);
	const { hp, status } = parseCondition(condition);

	if (side.active) {
		if (ident.startsWith(state.ourSide)) {
			side.active.hp = hp;
		} else {
			side.active.hp = hp / 100;
		}
		if (status) side.active.status = status;
		if (status === 'fnt') side.active.fainted = true;
	}
}

function parseHeal(state: BattleState, args: string[]): void {
	const [ident, condition] = args;
	const side = getSide(state, ident);
	const { hp, status } = parseCondition(condition);

	if (side.active) {
		if (ident.startsWith(state.ourSide)) {
			side.active.hp = hp;
		} else {
			side.active.hp = hp / 100;
		}
		if (status) side.active.status = status;
	}
}

function parseStatus(state: BattleState, args: string[]): void {
	const [ident, status] = args;
	const side = getSide(state, ident);

	if (side.active) {
		side.active.status = status as StatusId;
	}
}

function parseCureStatus(state: BattleState, args: string[]): void {
	const [ident] = args;
	const side = getSide(state, ident);

	if (side.active) {
		side.active.status = null;
	}
}

function parseCureTeam(state: BattleState, args: string[]): void {
	const [ident] = args;
	const side = getSide(state, ident);

	for (const pokemon of side.team) {
		if (pokemon.status !== 'fnt') {
			pokemon.status = null;
		}
	}
}

function parseBoost(state: BattleState, args: string[], direction: 1 | -1): void {
	const [ident, stat, amount] = args;
	const side = getSide(state, ident);

	if (side.active) {
		const boostStat = stat as BoostId;
		const currentBoost = side.active.boosts[boostStat] || 0;
		const delta = direction * parseInt(amount);
		side.active.boosts[boostStat] = Math.max(-6, Math.min(6, currentBoost + delta));
	}
}

function parseSetBoost(state: BattleState, args: string[]): void {
	const [ident, stat, amount] = args;
	const side = getSide(state, ident);

	if (side.active) {
		side.active.boosts[stat as BoostId] = parseInt(amount);
	}
}

function parseClearBoost(state: BattleState, args: string[]): void {
	const [ident] = args;
	const side = getSide(state, ident);

	if (side.active) {
		side.active.boosts = {};
	}
}

function parseCopyBoost(state: BattleState, args: string[]): void {
	const [sourceIdent, targetIdent] = args;
	const sourceSide = getSide(state, sourceIdent);
	const targetSide = getSide(state, targetIdent);

	if (sourceSide.active && targetSide.active) {
		targetSide.active.boosts = { ...sourceSide.active.boosts };
	}
}

function parseInvertBoost(state: BattleState, args: string[]): void {
	const [ident] = args;
	const side = getSide(state, ident);

	if (side.active) {
		const boosts = side.active.boosts;
		for (const stat in boosts) {
			boosts[stat as BoostId] = -(boosts[stat as BoostId] || 0);
		}
	}
}

function parseSwapBoost(state: BattleState, args: string[]): void {
	const [ident1, ident2, stats] = args;
	const side1 = getSide(state, ident1);
	const side2 = getSide(state, ident2);

	if (side1.active && side2.active) {
		const statsToSwap = stats ? stats.split(', ') : Object.keys(side1.active.boosts);
		for (const stat of statsToSwap) {
			const temp = side1.active.boosts[stat as BoostId] || 0;
			side1.active.boosts[stat as BoostId] = side2.active.boosts[stat as BoostId] || 0;
			side2.active.boosts[stat as BoostId] = temp;
		}
	}
}

function parseAbility(state: BattleState, args: string[]): void {
	const [ident, ability] = args;
	const side = getSide(state, ident);

	if (side.active) {
		side.active.knownAbility = ability;
	}
}

function parseEndAbility(state: BattleState, args: string[]): void {
	const [ident] = args;
	const side = getSide(state, ident);

	if (side.active) {
		side.active.knownAbility = null;
	}
}

function parseItem(state: BattleState, args: string[]): void {
	const [ident, item] = args;
	const side = getSide(state, ident);

	if (side.active) {
		side.active.knownItem = item;
	}
}

function parseEndItem(state: BattleState, args: string[]): void {
	const [ident] = args;
	const side = getSide(state, ident);

	if (side.active) {
		side.active.itemConsumed = true;
		side.active.knownItem = null;
	}
}

function parseWeather(state: BattleState, args: string[]): void {
	const [weather] = args;

	if (weather === 'none') {
		state.field.weather = null;
		state.field.weatherTurns = 0;
	} else {
		const weatherMap: Record<string, Weather> = {
			SunnyDay: 'sun',
			RainDance: 'rain',
			Sandstorm: 'sand',
			Snow: 'snow',
			Hail: 'hail',
			DesolateLand: 'harshsun',
			PrimordialSea: 'heavyrain',
			DeltaStream: 'strongwinds',
		};
		state.field.weather = weatherMap[weather] ?? (weather.toLowerCase() as Weather);
		state.field.weatherTurns = 5; // Default, will decrement
	}
}

function parseFieldStart(state: BattleState, args: string[]): void {
	const [condition] = args;

	if (condition.includes('Terrain')) {
		const terrainMap: Record<string, Terrain> = {
			'Electric Terrain': 'electric',
			'Grassy Terrain': 'grassy',
			'Misty Terrain': 'misty',
			'Psychic Terrain': 'psychic',
		};
		state.field.terrain = terrainMap[condition] ?? null;
		state.field.terrainTurns = 5;
	} else if (condition === 'Trick Room') {
		state.field.trickRoom = 5;
	} else if (condition === 'Gravity') {
		state.field.gravity = 5;
	} else if (condition === 'Magic Room') {
		state.field.magicRoom = 5;
	} else if (condition === 'Wonder Room') {
		state.field.wonderRoom = 5;
	}
}

function parseFieldEnd(state: BattleState, args: string[]): void {
	const [condition] = args;

	if (condition.includes('Terrain')) {
		state.field.terrain = null;
		state.field.terrainTurns = 0;
	} else if (condition === 'Trick Room') {
		state.field.trickRoom = 0;
	} else if (condition === 'Gravity') {
		state.field.gravity = 0;
	} else if (condition === 'Magic Room') {
		state.field.magicRoom = 0;
	} else if (condition === 'Wonder Room') {
		state.field.wonderRoom = 0;
	}
}

function parseSideStart(state: BattleState, args: string[]): void {
	const [sideIdent, condition] = args;
	const side = getSide(state, sideIdent);

	const condId = toId(condition);

	if (condId === 'stealthrock') {
		side.hazards.stealthRock = true;
	} else if (condId === 'spikes') {
		side.hazards.spikes = Math.min(3, side.hazards.spikes + 1);
	} else if (condId === 'toxicspikes') {
		side.hazards.toxicSpikes = Math.min(2, side.hazards.toxicSpikes + 1);
	} else if (condId === 'stickyweb') {
		side.hazards.stickyWeb = true;
	} else if (condId === 'reflect') {
		side.screens.reflect = 5;
	} else if (condId === 'lightscreen') {
		side.screens.lightScreen = 5;
	} else if (condId === 'auroraveil') {
		side.screens.auroraVeil = 5;
	} else if (condId === 'tailwind') {
		side.tailwind = 4;
	}
}

function parseSideEnd(state: BattleState, args: string[]): void {
	const [sideIdent, condition] = args;
	const side = getSide(state, sideIdent);

	const condId = toId(condition);

	if (condId === 'stealthrock') {
		side.hazards.stealthRock = false;
	} else if (condId === 'spikes') {
		side.hazards.spikes = 0;
	} else if (condId === 'toxicspikes') {
		side.hazards.toxicSpikes = 0;
	} else if (condId === 'stickyweb') {
		side.hazards.stickyWeb = false;
	} else if (condId === 'reflect') {
		side.screens.reflect = 0;
	} else if (condId === 'lightscreen') {
		side.screens.lightScreen = 0;
	} else if (condId === 'auroraveil') {
		side.screens.auroraVeil = 0;
	} else if (condId === 'tailwind') {
		side.tailwind = 0;
	}
}

function parseVolatileStart(state: BattleState, args: string[]): void {
	const [ident, volatile] = args;
	const side = getSide(state, ident);

	if (side.active) {
		side.active.volatiles.add(toId(volatile));
	}
}

function parseVolatileEnd(state: BattleState, args: string[]): void {
	const [ident, volatile] = args;
	const side = getSide(state, ident);

	if (side.active) {
		side.active.volatiles.delete(toId(volatile));
	}
}

function parseMega(state: BattleState, args: string[]): void {
	const [ident, _pokemon, _stone] = args;
	const side = getSide(state, ident);

	if (side.active) {
		// Mega evolution - types may change
		// The -formechange message will handle species/type updates
	}
}

function parseTerastallize(state: BattleState, args: string[]): void {
	const [ident, teraType] = args;
	const side = getSide(state, ident);

	if (side.active) {
		side.active.terastallized = teraType as TypeName;
		// Terastallizing changes the Pokemon's type
		side.active.types = [teraType as TypeName];
	}
}

function parseFaint(state: BattleState, args: string[]): void {
	const [ident] = args;
	const side = getSide(state, ident);

	if (side.active) {
		side.active.fainted = true;
		side.active.hp = 0;
		side.active.status = 'fnt';
		side.faintedCount++;
	}
}

function parseTransform(state: BattleState, args: string[]): void {
	const [sourceIdent, targetIdent] = args;
	const sourceSide = getSide(state, sourceIdent);
	const targetSide = getSide(state, targetIdent);

	if (sourceSide.active && targetSide.active) {
		// Transform copies appearance, types, stats (except HP), moves, etc.
		sourceSide.active.types = [...targetSide.active.types];
		sourceSide.active.boosts = { ...targetSide.active.boosts };
		// Note: Species display changes but we keep tracking the original Pokemon
	}
}

// ============ Request Parsing ============

/**
 * Parse a battle request JSON.
 */
export function parseRequest(json: string): BattleRequest {
	if (!json) {
		return { requestType: 'wait', rqid: 0 };
	}

	const data = JSON.parse(json);

	let requestType: BattleRequest['requestType'] = 'wait';

	if (data.wait) {
		requestType = 'wait';
	} else if (data.teamPreview) {
		requestType = 'teamPreview';
	} else if (data.forceSwitch?.some(Boolean)) {
		requestType = 'switch';
	} else if (data.active) {
		requestType = 'move';
	}

	return {
		requestType,
		rqid: data.rqid || 0,
		active: data.active as ActiveRequest[] | undefined,
		side: data.side,
		forceSwitch: data.forceSwitch,
		teamPreview: data.teamPreview,
		maxTeamSize: data.maxTeamSize,
	};
}

/**
 * Update our team from request side data.
 */
export function updateOurTeamFromRequest(state: BattleState, sidePokemon: SidePokemon[]): void {
	const ourSide = state[state.ourSide];

	ourSide.team = sidePokemon.map((p, i) => {
		const { species, level, gender, shiny } = parseDetails(p.details);
		const { hp, maxHp, status } = parseCondition(p.condition);
		const types = getSpeciesTypes(species, state.format.generation);

		const existing = ourSide.team[i];

		return {
			species,
			speciesId: toId(species),
			level,
			gender,
			shiny,
			types: types as TypeName[],
			hp,
			maxHp,
			status,
			boosts: existing?.boosts ?? {},
			volatiles: existing?.volatiles ?? new Set(),
			knownMoves: p.moves,
			moves: p.moves,
			knownAbility: p.ability,
			ability: p.ability,
			knownItem: p.item,
			item: p.item,
			itemConsumed: false,
			terastallized: null,
			dynamaxed: false,
			active: p.active,
			fainted: status === 'fnt',
			slot: i,
			stats: p.stats,
			teraType: p.teraType,
		};
	});

	// Update active reference
	const activePokemon = ourSide.team.find(p => p.active);
	if (activePokemon) {
		ourSide.active = activePokemon;
	}
}
