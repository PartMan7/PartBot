/**
 * Heuristic decision engine based on PartProfessor AI.
 * Uses weighted scoring to evaluate moves and switches.
 *
 * @see https://github.com/PartMan7/PartProfessor/blob/master/data/BATTLE/ai.js
 */

import {
	getEffectiveness,
	getMove,
	getSpecies,
	grantsGroundImmunity,
	isAdaptability,
	isHazardMove,
	itemGrantsGroundImmunity,
} from '@/ps/battle/data';
import { sample } from '@/utils/random';
import { toId } from '@/utils/toId';

import type { DecisionEngine } from '@/ps/battle/decision';
import type {
	AILevel,
	Action,
	BattleState,
	DecisionContext,
	DecisionResult,
	MoveAction,
	Pokemon,
	SwitchAction,
	TypeName,
} from '@/ps/battle/types';

/**
 * Heuristic-based decision engine.
 * AI levels:
 * - 0: Random
 * - 1: Basic type effectiveness
 * - 2: Full heuristic with move weights, hazards, setup, etc.
 */
export class HeuristicDecisionEngine implements DecisionEngine {
	name = 'heuristic';
	aiLevel: AILevel;

	constructor(aiLevel: AILevel = 2) {
		this.aiLevel = aiLevel;
	}

	async decide(ctx: DecisionContext): Promise<DecisionResult> {
		const { request, legalActions } = ctx;

		if (legalActions.length === 0) {
			return { action: { type: 'pass' }, confidence: 0, reasoning: 'No legal actions' };
		}

		if (legalActions.length === 1) {
			return { action: legalActions[0], confidence: 1, reasoning: 'Only one legal action' };
		}

		// Handle team preview
		if (request.requestType === 'teamPreview') {
			return this.handleTeamPreview(ctx);
		}

		// Handle force switch
		if (request.requestType === 'switch') {
			return this.handleForceSwitch(ctx);
		}

		// Normal turn - evaluate all actions
		return this.handleNormalTurn(ctx);
	}

	// ============ Team Preview ============

	private handleTeamPreview(ctx: DecisionContext): DecisionResult {
		const { state, legalActions } = ctx;
		const teamAction = legalActions.find(a => a.type === 'team');
		if (!teamAction || teamAction.type !== 'team') {
			return { action: { type: 'pass' }, confidence: 0, reasoning: 'No team action' };
		}

		if (this.aiLevel === 0) {
			// Random order
			const order = teamAction.order.slice().shuffle(ctx.RNG);
			return { action: { type: 'team', order }, confidence: 0.5, reasoning: 'Random team order' };
		}

		// Evaluate each Pokemon's effectiveness against opponent's team
		const ourSide = state[state.ourSide];
		const theirSide = state[state.ourSide === 'p1' ? 'p2' : 'p1'];
		const gen = state.format.generation;

		const scores: Record<number, number> = {};

		for (let i = 0; i < ourSide.team.length; i++) {
			const pokemon = ourSide.team[i];
			if (!pokemon) continue;

			let score = 0;

			// Score based on offensive coverage against opponent's visible team
			const moves = pokemon.moves ?? pokemon.knownMoves;
			for (const moveId of moves) {
				const move = getMove(moveId, gen);
				if (!move || move.category === 'Status') continue;

				for (const opponent of theirSide.team) {
					if (!opponent) continue;
					const eff = getEffectiveness(move.type, opponent.types);
					score += eff > 1 ? eff * 10 : 0;
				}
			}

			// Bonus for hazard setters as leads
			if (moves.some(m => isHazardMove(m))) {
				score += 30;
			}

			scores[i + 1] = score;
		}

		// Sort by score descending
		const order = Object.entries(scores)
			.sort(([, a], [, b]) => b - a)
			.map(([slot]) => parseInt(slot));

		// Fill remaining slots if needed
		while (order.length < teamAction.order.length) {
			for (let i = 1; i <= ourSide.team.length; i++) {
				if (!order.includes(i)) {
					order.push(i);
					break;
				}
			}
		}

		return {
			action: { type: 'team', order },
			confidence: 0.7,
			reasoning: `Lead: ${ourSide.team[order[0] - 1]?.species}`,
		};
	}

	// ============ Force Switch ============

	private handleForceSwitch(ctx: DecisionContext): DecisionResult {
		const { state, legalActions } = ctx;
		const switches = legalActions.filter((a): a is SwitchAction => a.type === 'switch');

		if (switches.length === 0) {
			return { action: { type: 'pass' }, confidence: 0, reasoning: 'No switches available' };
		}

		if (switches.length === 1) {
			return { action: switches[0], confidence: 1, reasoning: 'Only one switch available' };
		}

		if (this.aiLevel === 0) {
			const action = switches.random(ctx.RNG)!;
			return { action, confidence: 0.5, reasoning: 'Random switch' };
		}

		const ourSide = state[state.ourSide];
		const theirSide = state[state.ourSide === 'p1' ? 'p2' : 'p1'];
		const opponent = theirSide.active;

		// Score each switch option
		const scored = switches.map(sw => {
			const pokemon = ourSide.team[sw.slot - 1];
			const score = this.scoreSwitchIn(pokemon, opponent, state);
			return { action: sw, score };
		});

		// Pick based on weighted probability
		const weights: Record<string, number> = {};
		for (const { action, score } of scored) {
			// Use score^4 for more decisive selection
			weights[action.slot.toString()] = Math.max(0.01, score) ** 4;
		}

		const selectedSlot = parseInt(sample(weights));
		const selected = scored.find(s => s.action.slot === selectedSlot) ?? scored[0];

		return {
			action: selected.action,
			confidence: this.normalizeScore(selected.score),
			reasoning: `Switch to ${ourSide.team[selected.action.slot - 1]?.species}`,
		};
	}

	// ============ Normal Turn ============

	private handleNormalTurn(ctx: DecisionContext): DecisionResult {
		const { state, legalActions } = ctx;

		if (this.aiLevel === 0) {
			const action = legalActions.random(ctx.RNG)!;
			return { action, confidence: 0.5, reasoning: 'Random action' };
		}

		const ourSide = state[state.ourSide];
		const theirSide = state[state.ourSide === 'p1' ? 'p2' : 'p1'];
		const active = ourSide.active;
		const opponent = theirSide.active;

		if (!active) {
			return { action: { type: 'pass' }, confidence: 0, reasoning: 'No active Pokemon' };
		}

		// Score all actions
		const scored = legalActions.map(action => {
			const score = this.scoreAction(action, state, active, opponent);
			return { action, score };
		});

		// Pick based on weighted probability
		const weights: Record<string, number> = {};
		for (let i = 0; i < scored.length; i++) {
			weights[i.toString()] = Math.max(0.01, scored[i].score);
		}

		const selectedIndex = parseInt(sample(weights));
		const selected = scored[selectedIndex] ?? scored[0];

		let reasoning = '';
		if (selected.action.type === 'move') {
			reasoning = `Use ${selected.action.moveId}`;
		} else if (selected.action.type === 'switch') {
			reasoning = `Switch to ${ourSide.team[selected.action.slot - 1]?.species}`;
		}

		return {
			action: selected.action,
			confidence: this.normalizeScore(selected.score),
			reasoning,
		};
	}

	// ============ Scoring Functions ============

	private scoreAction(action: Action, state: BattleState, active: Pokemon, opponent: Pokemon | null): number {
		switch (action.type) {
			case 'move':
				return this.scoreMove(action, state, active, opponent);
			case 'switch':
				return this.scoreSwitch(action, state, active, opponent);
			case 'pass':
				return -100;
			default:
				return 0;
		}
	}

	private scoreMove(action: MoveAction, state: BattleState, active: Pokemon, opponent: Pokemon | null): number {
		const gen = state.format.generation;
		const move = getMove(action.moveId, gen);
		if (!move) return 0.01;

		let score = 0;
		const ourSide = state[state.ourSide];
		const theirSide = state[state.ourSide === 'p1' ? 'p2' : 'p1'];
		const selfBoosts = active.boosts;
		const allMoves = active.moves ?? active.knownMoves;

		// Base power contribution
		if (move.basePower) {
			score += move.basePower;
		}

		// ============ Setup Move Evaluation ============
		if (move.boosts && move.target === 'self') {
			// Offensive setup (Swords Dance, Nasty Plot, etc.)
			const atkBoost = move.boosts.atk || 0;
			const spaBoost = move.boosts.spa || 0;

			if (atkBoost > 0) {
				// Only value if we have physical moves
				const hasPhysical = allMoves.some(m => {
					const md = getMove(m, gen);
					return md && md.category === 'Physical';
				});
				if (hasPhysical) {
					const currentAtk = selfBoosts.atk || 0;
					score += Math.sqrt((6 - currentAtk) * atkBoost * 200);
				}
			}

			if (spaBoost > 0) {
				// Only value if we have special moves
				const hasSpecial = allMoves.some(m => {
					const md = getMove(m, gen);
					return md && md.category === 'Special';
				});
				if (hasSpecial) {
					const currentSpa = selfBoosts.spa || 0;
					score += Math.sqrt((6 - currentSpa) * spaBoost * 200);
				}
			}

			// Speed setup
			if (move.boosts.spe && move.boosts.spe > 0) {
				const currentSpe = selfBoosts.spe || 0;
				score += Math.sqrt((6 - currentSpe) * move.boosts.spe * 200);
			}

			// Defense setup (less valuable but still useful)
			if (move.boosts.def && move.boosts.def > 0) {
				const currentDef = selfBoosts.def || 0;
				score += Math.sqrt((6 - currentDef) * move.boosts.def * 50);
			}
			if (move.boosts.spd && move.boosts.spd > 0) {
				const currentSpd = selfBoosts.spd || 0;
				score += Math.sqrt((6 - currentSpd) * move.boosts.spd * 50);
			}
		}

		// Self-boost on attacking moves (like Power-Up Punch)
		if (move.selfBoost?.boosts) {
			const boosts = move.selfBoost.boosts;
			for (const stat of ['atk', 'spa', 'spe'] as const) {
				if (boosts[stat] && boosts[stat]! > 0) {
					const current = selfBoosts[stat] || 0;
					score += Math.sqrt((6 - current) * boosts[stat]! * 100);
				}
			}
		}

		// Secondary effect boosts (like Charge Beam)
		if (move.secondary?.self?.boosts) {
			const chance = move.secondary.chance || 100;
			const boosts = move.secondary.self.boosts;
			for (const stat of ['atk', 'spa', 'spe'] as const) {
				if (boosts[stat] && boosts[stat]! > 0) {
					const current = selfBoosts[stat] || 0;
					score += (chance / 100) * Math.sqrt((6 - current) * boosts[stat]! * 50);
				}
			}
		}

		// ============ Type Effectiveness ============
		if (opponent && move.category !== 'Status') {
			// Check for Ground immunity (Levitate, Air Balloon)
			if (move.type === 'Ground') {
				if (grantsGroundImmunity(opponent.knownAbility) || itemGrantsGroundImmunity(opponent.knownItem)) {
					return 0.5;
				}
				// Check possible Levitate
				const species = getSpecies(opponent.species, gen);
				if (species?.abilities.some(a => toId(a) === 'levitate')) {
					score /= 4;
				}
			}

			// Shedinja check - only super effective moves work
			if (toId(opponent.species) === 'shedinja') {
				const eff = getEffectiveness(move.type, opponent.types);
				if (eff <= 1) return 0;
			}

			// Type effectiveness multiplier
			const effectiveness = getEffectiveness(move.type, opponent.types);
			score *= effectiveness;
		}

		// ============ STAB Bonus ============
		if (move.category !== 'Status') {
			const species = getSpecies(active.species, gen);
			const hasStab = species?.types.includes(move.type as TypeName) || active.types.includes(move.type as TypeName);
			if (hasStab) {
				const ability = active.ability || active.knownAbility;
				score *= isAdaptability(ability) ? 2 : 1.5;
			}
		}

		// ============ Hazard Moves ============
		const moveId = toId(move.name);
		const setHazards = theirSide.hazards;

		if (moveId === 'stealthrock' && !setHazards.stealthRock) {
			// Value based on remaining opponent Pokemon
			const remainingOpponents = theirSide.team.filter(p => !p.fainted && p.hp > 0).length;
			score += remainingOpponents * 20;
		}

		if (moveId === 'spikes' && setHazards.spikes < 3) {
			const remainingOpponents = theirSide.team.filter(p => !p.fainted && p.hp > 0).length;
			score += remainingOpponents * (3 - setHazards.spikes) * 10;
		}

		if (moveId === 'toxicspikes' && setHazards.toxicSpikes < 2) {
			const remainingOpponents = theirSide.team.filter(p => !p.fainted && p.hp > 0).length;
			score += remainingOpponents * (2 - setHazards.toxicSpikes) * 12;
		}

		if (moveId === 'stickyweb' && !setHazards.stickyWeb) {
			const remainingOpponents = theirSide.team.filter(p => !p.fainted && p.hp > 0).length;
			score += remainingOpponents * 15;
		}

		// ============ Hazard Removal ============
		const ourHazards = ourSide.hazards;
		const hasOurHazards = ourHazards.stealthRock || ourHazards.spikes > 0 || ourHazards.toxicSpikes > 0;
		if ((moveId === 'rapidspin' || moveId === 'defog') && hasOurHazards) {
			const remainingTeam = ourSide.team.filter(p => !p.fainted && p.hp > 0).length;
			score += remainingTeam * 15;
		}

		// ============ Recovery Moves ============
		if (move.heal || move.drain) {
			const hpPercent = active.maxHp ? active.hp / active.maxHp : active.hp;
			if (hpPercent < 0.5) {
				score += (1 - hpPercent) * 100;
			}
		}

		// ============ Status Moves ============
		if (move.category === 'Status' && opponent && !opponent.status) {
			if (['toxic', 'willowisp', 'thunderwave', 'spore', 'sleeppowder'].includes(moveId)) {
				score += 40;
			}
		}

		// ============ Priority Moves ============
		if (move.priority > 0 && opponent && opponent.hp < 0.3) {
			score += move.priority * 30;
		}

		// ============ Gimmick Bonuses ============
		if (action.mega) score += 15;
		if (action.dynamax) score += 20;
		if (action.terastallize) {
			// Tera is valuable for STAB boost or defensive typing
			// TODO: You only get one in the match, so this needs to be weighted differently based on how desperately you need to do it NOW
			const teraType = active.teraType;
			if (teraType === move.type) {
				score += 25; // STAB boost
			}
		}

		// ============ Accuracy Penalty ============
		if (typeof move.accuracy === 'number' && move.accuracy < 100) {
			score *= move.accuracy / 100;
		}

		return Math.max(0.01, score);
	}

	private scoreSwitch(action: SwitchAction, state: BattleState, active: Pokemon, opponent: Pokemon | null): number {
		const ourSide = state[state.ourSide];
		const pokemon = ourSide.team[action.slot - 1];

		if (!pokemon || pokemon.fainted || pokemon.hp <= 0) {
			return 0;
		}

		let score = this.scoreSwitchIn(pokemon, opponent, state);

		// Penalty for switching in general (loses momentum)
		score -= 20;

		// Compare to current active
		if (active) {
			const currentScore = this.scoreCurrentActive(active, opponent, state);
			// Only switch if significantly better
			if (score < currentScore * 1.2) {
				score *= 0.5;
			}
		}

		return Math.max(0.01, score);
	}

	private scoreSwitchIn(pokemon: Pokemon, opponent: Pokemon | null, state: BattleState): number {
		if (!pokemon || pokemon.fainted) return 0;

		const gen = state.format.generation;
		const ourSide = state[state.ourSide];
		let score = 50;

		// Prefer healthier Pokemon
		const hpPercent = pokemon.maxHp ? pokemon.hp / pokemon.maxHp : pokemon.hp;
		score += hpPercent * 30;

		// Prefer Pokemon without status
		if (!pokemon.status) score += 10;
		if (pokemon.status === 'brn') score -= 15;
		if (pokemon.status === 'par') score -= 10;
		if (pokemon.status === 'tox') score -= 20;

		// Evaluate offensive matchup
		const moves = pokemon.moves ?? pokemon.knownMoves;
		let bestMoveScore = 0;

		for (const moveId of moves) {
			const move = getMove(moveId, gen);
			if (!move || move.category === 'Status') continue;

			let moveScore = move.basePower || 0;

			// Type effectiveness vs opponent
			if (opponent) {
				const eff = getEffectiveness(move.type, opponent.types);
				moveScore *= eff;
			}

			// STAB
			if (pokemon.types.includes(move.type as TypeName)) {
				moveScore *= 1.5;
			}

			bestMoveScore = Math.max(bestMoveScore, moveScore);
		}

		score += bestMoveScore;

		// Defensive matchup - how much damage will we take?
		if (opponent) {
			const theirMoves = opponent.knownMoves;
			let worstThreat = 1;

			for (const moveId of theirMoves) {
				const move = getMove(moveId, gen);
				if (!move || move.category === 'Status') continue;

				const eff = getEffectiveness(move.type, pokemon.types);
				worstThreat = Math.max(worstThreat, eff);
			}

			score /= 1.1 + worstThreat ** 2;
		}

		// Hazard damage consideration
		if (ourSide.hazards.stealthRock) {
			const rockEff = getEffectiveness('Rock', pokemon.types);
			score -= rockEff * 15;
		}
		score -= ourSide.hazards.spikes * 8;
		if (ourSide.hazards.toxicSpikes > 0 && !pokemon.types.includes('Poison') && !pokemon.types.includes('Steel')) {
			score -= ourSide.hazards.toxicSpikes * 10;
		}
		if (ourSide.hazards.stickyWeb) {
			score -= 10;
		}

		return score;
	}

	private scoreCurrentActive(active: Pokemon, opponent: Pokemon | null, state: BattleState): number {
		const gen = state.format.generation;
		let score = 50;

		// HP value
		const hpPercent = active.maxHp ? active.hp / active.maxHp : active.hp;
		score += hpPercent * 30;

		// Boost value
		const boostValue = Object.values(active.boosts).sum();
		score += boostValue * 15;

		// Offensive potential
		const moves = active.moves ?? active.knownMoves;
		let bestMoveScore = 0;

		for (const moveId of moves) {
			const move = getMove(moveId, gen);
			if (!move || move.category === 'Status') continue;

			let moveScore = move.basePower || 0;

			if (opponent) {
				const eff = getEffectiveness(move.type, opponent.types);
				moveScore *= eff;
			}

			if (active.types.includes(move.type as TypeName)) {
				moveScore *= 1.5;
			}

			bestMoveScore = Math.max(bestMoveScore, moveScore);
		}

		score += bestMoveScore;

		return score;
	}

	// ============ Utility ============

	private normalizeScore(score: number): number {
		// Convert arbitrary score to 0-1 confidence
		return Math.max(0, Math.min(1, (score + 100) / 300));
	}
}
