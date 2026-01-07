/**
 * Battle instance class.
 * Manages state for a single battle.
 */

import { actionToCommand, getLegalActions } from '@/ps/battle/decision';
import { parseRequest, updateOurTeamFromRequest } from '@/ps/battle/parser';
import { Logger } from '@/utils/logger';
import { sample, useRNG } from '@/utils/random';

import type { DecisionEngine } from '@/ps/battle/decision';
import type { BattleRequest, BattleState, FormatConfig, Hazards, Screens, Side } from '@/ps/battle/types';
import type { Client } from 'ps-client';

export class Battle {
	state: BattleState;
	roomId: string;
	private client: Client;
	private engine: DecisionEngine;
	seed: number;
	RNG: () => number;

	constructor(client: Client, roomId: string, format: FormatConfig, ourSide: 'p1' | 'p2', engine: DecisionEngine, seed?: number) {
		this.client = client;
		this.roomId = roomId;
		this.engine = engine;
		this.state = this.createInitialState(roomId, format, ourSide);

		const rngSeed = seed ?? sample(1e12);
		this.seed = rngSeed;
		const RNG = useRNG(rngSeed);
		this.RNG = RNG;
	}

	send(text: string): void {
		this.client.getRoom(this.roomId).send(text);
	}

	private createInitialState(roomId: string, format: FormatConfig, ourSide: 'p1' | 'p2'): BattleState {
		const createHazards = (): Hazards => ({
			stealthRock: false,
			spikes: 0,
			toxicSpikes: 0,
			stickyWeb: false,
		});

		const createScreens = (): Screens => ({
			reflect: 0,
			lightScreen: 0,
			auroraVeil: 0,
		});

		const createSide = (id: 'p1' | 'p2'): Side => ({
			name: '',
			odentifier: id,
			active: null,
			team: [],
			teamSize: format.teamSize,
			faintedCount: 0,
			totalPokemon: format.teamSize,
			hazards: createHazards(),
			screens: createScreens(),
			tailwind: 0,
			wish: null,
		});

		return {
			format,
			turn: 0,
			phase: format.hasTeamPreview ? 'teamPreview' : 'active',
			p1: createSide('p1'),
			p2: createSide('p2'),
			field: {
				weather: null,
				weatherTurns: 0,
				terrain: null,
				terrainTurns: 0,
				trickRoom: 0,
				gravity: 0,
				magicRoom: 0,
				wonderRoom: 0,
			},
			roomId,
			startedAt: new Date(),
			ourSide,
			rqid: 0,
		};
	}

	/**
	 * Process a protocol line and potentially return a command.
	 */
	async processLine(line: string): Promise<string | null> {
		if (!line) return null;

		// Handle request separately (contains JSON)
		if (line.startsWith('|request|')) {
			const json = line.slice(9);
			return this.handleRequest(json);
		}

		// Parse protocol line and update state
		if (line.startsWith('|')) {
			// donotpush TODO
			// parseProtocolLine(this.state, line);
		}

		// Handle battle end
		if (line.startsWith('|win|') || line.startsWith('|tie|')) {
			this.state.phase = 'ended';
			const won = this.didWeWin(line);
			await this.engine.onBattleEnd?.(this.state, won);
			Logger.log(`[Battle] ${this.state.roomId} ended - ${won ? 'Won' : 'Lost'}`);
		}

		return null;
	}

	private didWeWin(line: string): boolean {
		// |win|Username or |tie|
		if (line.startsWith('|tie|')) return false;

		const winner = line.slice(5);
		const ourName = this.state[this.state.ourSide].name;

		return winner.toLowerCase() === ourName.toLowerCase();
	}

	async handleRequest(json: string): Promise<string | null> {
		if (!json) return null;

		let request: BattleRequest;
		try {
			request = parseRequest(json);
		} catch (err) {
			Logger.errorLog(err instanceof Error ? err : new Error(String(err)));
			return null;
		}

		this.state.rqid = request.rqid;

		// Wait request - opponent still deciding
		if (request.requestType === 'wait') {
			this.state.phase = 'waiting';
			return null;
		}

		// Update phase
		this.updatePhase(request);

		// Update our team info from request
		if (request.side) {
			updateOurTeamFromRequest(this.state, request.side.pokemon);

			// Detect our side from request if not set
			if (request.side.id) {
				this.state.ourSide = request.side.id;
			}
		}

		// Get legal actions
		const legalActions = getLegalActions(request, this.state);

		if (legalActions.length === 0) {
			return null;
		}

		// Get decision from engine
		try {
			const result = await this.engine.decide({
				state: this.state,
				request,
				legalActions,
				RNG: this.RNG,
			});

			Logger.log(`[Battle] ${this.state.roomId} Turn ${this.state.turn}: ${result.reasoning}`);

			// Convert action to command
			return actionToCommand(result.action);
		} catch (err) {
			Logger.errorLog(err instanceof Error ? err : new Error(String(err)));

			// Fallback: pick first legal action
			if (legalActions.length > 0) {
				return actionToCommand(legalActions[0]);
			}
			return null;
		}
	}

	private updatePhase(request: BattleRequest): void {
		if (request.requestType === 'teamPreview') {
			this.state.phase = 'teamPreview';
		} else if (request.forceSwitch?.some(Boolean)) {
			this.state.phase = 'forceSwitch';
		} else {
			this.state.phase = 'active';
		}
	}

	/**
	 * Check if the battle has ended.
	 */
	isEnded(): boolean {
		return this.state.phase === 'ended';
	}

	/**
	 * Get summary of current state (for debugging).
	 */
	getSummary(): string {
		const { state } = this;
		const us = state[state.ourSide];
		const them = state[state.ourSide === 'p1' ? 'p2' : 'p1'];

		const ourActive = us.active?.species ?? 'None';
		const theirActive = them.active?.species ?? 'None';
		const ourRemaining = us.team.filter(p => !p.fainted).length;
		const theirRemaining = them.team.filter(p => !p.fainted).length;

		return `Turn ${state.turn}: ${ourActive} vs ${theirActive} (${ourRemaining}-${theirRemaining})`;
	}
}
