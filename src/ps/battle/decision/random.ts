/**
 * Random decision engine - baseline/fallback.
 * Picks a random legal action.
 */

import type { DecisionEngine } from '@/ps/battle/decision';
import type { DecisionContext, DecisionResult } from '@/ps/battle/types';

export class RandomDecisionEngine implements DecisionEngine {
	name = 'random';

	async decide(ctx: DecisionContext): Promise<DecisionResult> {
		const { legalActions } = ctx;

		if (legalActions.length === 0) {
			return { action: { type: 'pass' }, confidence: 0, reasoning: 'No legal actions' };
		}

		const action = legalActions.random(ctx.RNG)!;
		return { action, confidence: 0, reasoning: 'Random selection' };
	}
}
