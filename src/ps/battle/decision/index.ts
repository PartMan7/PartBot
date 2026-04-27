/**
 * Decision engine interface and utilities.
 * Provides a common interface for different AI implementations.
 */

import { Logger } from '@/utils/logger';

import type { Action, BattleRequest, BattleState, DecisionContext, DecisionResult } from '@/ps/battle/types';

/**
 * Interface for battle decision engines.
 * Implementations can range from random to ML-based.
 */
export interface DecisionEngine {
	/** Name of the engine (for logging) */
	name: string;

	/** Select an action given the current battle context */
	decide(ctx: DecisionContext): Promise<DecisionResult>;

	/** Called when battle starts (for initialization) */
	onBattleStart?(state: BattleState): Promise<void>;

	/** Called when battle ends (for learning/logging) */
	onBattleEnd?(state: BattleState, won: boolean): Promise<void>;
}

/**
 * Chain of decision engines - tries each in order until one succeeds.
 * Useful for fallback behavior (e.g., API -> Heuristic -> Random).
 */
export class DecisionEngineChain implements DecisionEngine {
	name = 'chain';
	private engines: DecisionEngine[];

	constructor(engines: DecisionEngine[]) {
		this.engines = engines;
	}

	async decide(ctx: DecisionContext): Promise<DecisionResult> {
		for (const engine of this.engines) {
			try {
				const result = await engine.decide(ctx);
				return {
					...result,
					reasoning: `[${engine.name}] ${result.reasoning || ''}`.trim(),
				};
			} catch (err) {
				// Log and try next engine
				Logger.errorLog(err instanceof Error ? err : new Error(`Engine ${engine.name} failed: ${err}`));
			}
		}

		// Ultimate fallback: first legal action
		const action = ctx.legalActions[0] ?? { type: 'pass' as const };
		return { action, confidence: 0, reasoning: '[fallback] No engine succeeded' };
	}

	async onBattleStart(state: BattleState): Promise<void> {
		await Promise.all(this.engines.map(e => e.onBattleStart?.(state)));
	}

	async onBattleEnd(state: BattleState, won: boolean): Promise<void> {
		await Promise.all(this.engines.map(e => e.onBattleEnd?.(state, won)));
	}
}

/**
 * Get legal actions from a battle request.
 */
export function getLegalActions(request: BattleRequest, state: BattleState): Action[] {
	const actions: Action[] = [];

	if (request.requestType === 'wait') {
		return [];
	}

	if (request.requestType === 'teamPreview') {
		// For team preview, generate team order action
		const teamSize = request.maxTeamSize ?? state.format.teamSize;
		const order = Array.from({ length: teamSize }, (_, i) => i + 1);
		actions.push({ type: 'team', order });
		return actions;
	}

	if (request.requestType === 'switch' || request.forceSwitch?.[0]) {
		// Must switch - only switch actions allowed
		const ourSide = state[state.ourSide];
		for (let i = 0; i < ourSide.team.length; i++) {
			const pokemon = ourSide.team[i];
			if (!pokemon.active && !pokemon.fainted && pokemon.hp > 0) {
				actions.push({
					type: 'switch',
					slot: i + 1,
					pokemonName: pokemon.species,
				});
			}
		}
		return actions;
	}

	// Normal move selection
	if (request.active?.[0]) {
		const active = request.active[0];
		const ourSide = state[state.ourSide];

		// Add move actions
		for (let i = 0; i < active.moves.length; i++) {
			const move = active.moves[i];
			if (!move.disabled && move.pp > 0) {
				const baseAction: Action = {
					type: 'move',
					slot: i + 1,
					moveId: move.id,
				};
				actions.push(baseAction);

				// Mega evolution
				if (active.canMegaEvo) {
					actions.push({ ...baseAction, mega: true });
				}

				// Z-Move
				if (active.canZMove?.[i]) {
					actions.push({ ...baseAction, zmove: true });
				}

				// Dynamax
				if (active.canDynamax) {
					actions.push({ ...baseAction, dynamax: true });
				}

				// Terastallize
				if (active.canTerastallize) {
					actions.push({ ...baseAction, terastallize: true });
				}
			}
		}

		// Add switch actions (if not trapped)
		if (!active.trapped && !active.maybeTrapped) {
			for (let i = 0; i < ourSide.team.length; i++) {
				const pokemon = ourSide.team[i];
				if (!pokemon.active && !pokemon.fainted && pokemon.hp > 0) {
					actions.push({
						type: 'switch',
						slot: i + 1,
						pokemonName: pokemon.species,
					});
				}
			}
		}
	}

	// If no actions available, add pass
	if (actions.length === 0) {
		actions.push({ type: 'pass' });
	}

	return actions;
}

/**
 * Convert an action to a PS command string.
 */
export function actionToCommand(action: Action): string {
	switch (action.type) {
		case 'move': {
			let cmd = `move ${action.slot}`;
			if (action.mega) cmd += ' mega';
			if (action.zmove) cmd += ' zmove';
			if (action.dynamax) cmd += ' dynamax';
			if (action.terastallize) cmd += ' terastallize';
			if (action.target !== undefined) cmd += ` ${action.target}`;
			return cmd;
		}
		case 'switch':
			return `switch ${action.slot}`;
		case 'team':
			return `team ${action.order.join('')}`;
		case 'pass':
			return 'pass';
	}
}

// Re-export implementations
export { APIDecisionEngine } from '@/ps/battle/decision/api';
export { HeuristicDecisionEngine } from '@/ps/battle/decision/heuristic';
export { RandomDecisionEngine } from '@/ps/battle/decision/random';
