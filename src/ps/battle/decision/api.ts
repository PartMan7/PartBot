/**
 * API-based decision engine.
 * Delegates decision making to an external service.
 * Useful for heavy ML inference or complex battle bots.
 */

import type { DecisionEngine } from '@/ps/battle/decision';
import type { Action, BattleState, DecisionContext, DecisionResult } from '@/ps/battle/types';

export interface APIDecisionEngineConfig {
	url: string;
	timeout?: number | undefined;
	headers?: Record<string, string> | undefined;
	/** API key (will be sent as Authorization header) */
	apiKey?: string | undefined;
}

export class APIDecisionEngine implements DecisionEngine {
	name = 'api';
	private config: APIDecisionEngineConfig;

	constructor(config: APIDecisionEngineConfig) {
		this.config = {
			timeout: 10000,
			...config,
		};
	}

	async decide(ctx: DecisionContext): Promise<DecisionResult> {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), this.config.timeout);

		try {
			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
				...this.config.headers,
			};

			if (this.config.apiKey) {
				headers['Authorization'] = `Bearer ${this.config.apiKey}`;
			}

			const response = await fetch(`${this.config.url}/decide`, {
				method: 'POST',
				headers,
				body: JSON.stringify({
					state: this.serializeState(ctx.state),
					request: ctx.request,
					legalActions: ctx.legalActions,
				}),
				signal: controller.signal,
			});

			if (!response.ok) {
				throw new Error(`API returned ${response.status}: ${await response.text()}`);
			}

			const data = (await response.json()) as { action: Action; confidence?: number; reasoning?: string };

			return {
				action: data.action,
				confidence: data.confidence ?? undefined,
				reasoning: data.reasoning ?? 'API decision',
			};
		} finally {
			clearTimeout(timeout);
		}
	}

	async onBattleStart(state: BattleState): Promise<void> {
		// Optionally notify API of new battle
		try {
			await fetch(`${this.config.url}/battle/start`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
				},
				body: JSON.stringify({
					roomId: state.roomId,
					format: state.format.id,
					ourSide: state.ourSide,
				}),
			});
		} catch {
			// Non-critical, ignore errors
		}
	}

	async onBattleEnd(state: BattleState, won: boolean): Promise<void> {
		// Optionally notify API of battle result (for learning)
		try {
			await fetch(`${this.config.url}/battle/end`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
				},
				body: JSON.stringify({
					roomId: state.roomId,
					won,
					turn: state.turn,
				}),
			});
		} catch {
			// Non-critical, ignore errors
		}
	}

	private serializeState(state: BattleState): object {
		// Convert state to JSON-serializable format
		// Handle Sets and other non-serializable types
		return JSON.parse(
			JSON.stringify(state, (_, value) => {
				if (value instanceof Set) return [...value];
				return value;
			})
		);
	}
}
