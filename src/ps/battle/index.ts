/**
 * Battle Manager - orchestrates all battle instances.
 * Handles ladder queue, challenge acceptance, and routing.
 */

import { Battle } from '@/ps/battle/battle';
import { APIDecisionEngine, DecisionEngineChain, HeuristicDecisionEngine, RandomDecisionEngine } from '@/ps/battle/decision';
import { FORMATS } from '@/ps/battle/types';
import { Logger } from '@/utils/logger';
import { toId } from '@/utils/toId';

import type { DecisionEngine } from '@/ps/battle/decision';
import type { AILevel, FormatConfig } from '@/ps/battle/types';
import type { Client, Room } from 'ps-client';

export interface BattleManagerConfig {
	/** External decision API URL (optional) */
	apiUrl?: string | undefined;
	/** API key for external service */
	apiKey?: string | undefined;
	/** Use built-in heuristic engine */
	useHeuristic?: boolean | undefined;
	/**
	 * AI difficulty level
	 * 0: Random
	 * 1: Basic type effectiveness
	 * 2: Heuristic-based with move weights, hazards, setup, etc.
	 */
	aiLevel?: AILevel | undefined;
	/** Auto-queue for ladder battles */
	autoLadder?: boolean | undefined;
	/** Formats to ladder */
	ladderFormats?: string[] | undefined;
	/** Max simultaneous battles */
	maxConcurrent?: number | undefined;
	/** Auto-accept challenges */
	acceptChallenges?: boolean | undefined;
	/** Formats to accept challenges for */
	acceptFormats?: string[] | undefined;
}

export class BattleManager {
	client: Client;
	decisionEngine: DecisionEngine;
	battles: Map<string, Battle> = new Map();
	private config: BattleManagerConfig;

	// Ladder state
	private isLaddering = false;
	private currentSearches = new Set<string>();
	private ladderInterval: ReturnType<typeof setInterval> | null = null;

	// Statistics
	stats = {
		battlesStarted: 0,
		battlesWon: 0,
		battlesLost: 0,
	};

	constructor(client: Client, config: BattleManagerConfig = {}) {
		this.client = client;
		this.config = {
			useHeuristic: true,
			aiLevel: 2,
			maxConcurrent: 1,
			acceptChallenges: false,
			...config,
		};

		// Build decision engine chain
		this.decisionEngine = this.buildDecisionEngine();

		Logger.log('[BattleManager] Initialized');
	}

	private buildDecisionEngine(): DecisionEngine {
		const engines: DecisionEngine[] = [];

		// API engine (highest priority if configured)
		if (this.config.apiUrl) {
			engines.push(
				new APIDecisionEngine({
					url: this.config.apiUrl,
					apiKey: this.config.apiKey,
				})
			);
		}

		// Heuristic engine
		if (this.config.useHeuristic !== false) {
			engines.push(new HeuristicDecisionEngine(this.config.aiLevel ?? 2));
		}

		// Random fallback
		engines.push(new RandomDecisionEngine());

		return new DecisionEngineChain(engines);
	}

	// ============ Message Handling ============

	/**
	 * Handle a message from any room.
	 * Call this for all messages; it will filter for battle rooms.
	 */
	async handleMessage(room: Room | null, line: string, isIntro?: boolean): Promise<void> {
		if (isIntro) return;
		if (!room || !room.id.startsWith('battle-')) return;

		const roomId = room.id;

		// Get or create battle instance
		let battle = this.battles.get(roomId);

		if (!battle) {
			// New battle
			const format = this.parseFormatFromRoom(roomId);
			const ourSide = this.detectOurSide(line);

			if (!ourSide) {
				// Can't determine side yet, store line for later?
				// For now, default to p1 and correct later from request
				battle = new Battle(this.client, roomId, format, 'p1', this.decisionEngine);
			} else {
				battle = new Battle(this.client, roomId, format, ourSide, this.decisionEngine);
			}

			this.battles.set(roomId, battle);
			this.stats.battlesStarted++;

			await this.decisionEngine.onBattleStart?.(battle.state);
			Logger.log(`[Battle] Started ${roomId}`);
		}

		// Process the line
		const command = await battle.processLine(line);

		if (command) {
			room.send(`/choose ${command}`);
		}

		// Clean up ended battles
		if (battle.isEnded()) {
			// Track win/loss
			const ourFainted = battle.state[battle.state.ourSide].faintedCount;
			const theirFainted = battle.state[battle.state.ourSide === 'p1' ? 'p2' : 'p1'].faintedCount;
			const didWin = ourFainted < theirFainted;
			if (didWin) {
				this.stats.battlesWon++;
			} else {
				this.stats.battlesLost++;
			}

			this.battles.delete(roomId);
			this.currentSearches.clear();

			// Continue laddering if enabled
			if (this.isLaddering) {
				this.maybeStartSearch();
			}
		}
	}

	parseFormatFromRoom(roomId: string): FormatConfig {
		// Format: battle-{format}-{id}
		// e.g., battle-gen9randombattle-12345
		const parts = roomId.split('-');
		const formatId = parts.slice(1, -1).join('-');

		if (FORMATS[formatId]) {
			return FORMATS[formatId];
		}

		// Infer format
		return this.inferFormat(formatId);
	}

	inferFormat(formatId: string): FormatConfig {
		formatId = toId(formatId);
		const isRandom = formatId.includes('random');
		const genMatch = formatId.match(/gen(\d)/);
		const generation = genMatch ? parseInt(genMatch[1]) : 9;

		return {
			id: formatId,
			generation,
			isRandom,
			hasTeamPreview: !isRandom,
			teamSize: 6,
		};
	}

	private detectOurSide(line: string): 'p1' | 'p2' | null {
		// Try to detect from |player| line
		if (line.startsWith('|player|')) {
			const parts = line.split('|');
			if (parts.length >= 4) {
				const playerId = parts[2] as 'p1' | 'p2';
				const playerName = parts[3];
				const ourUsername = this.client.status.username;
				if (ourUsername && toId(playerName) === toId(ourUsername)) {
					return playerId;
				}
			}
		}
		return null;
	}

	// ============ Ladder Management ============

	/**
	 * Start laddering in specified formats.
	 */
	startLadder(formats?: string[]): void {
		const targetFormats = formats ?? this.config.ladderFormats ?? ['gen9randombattle'];
		this.config.ladderFormats = targetFormats;
		this.isLaddering = true;

		Logger.log(`[Ladder] Starting for: ${targetFormats.join(', ')}`);

		this.maybeStartSearch();

		// Periodic check for search continuation
		if (!this.ladderInterval) {
			this.ladderInterval = setInterval(() => {
				if (this.isLaddering) {
					this.maybeStartSearch();
				}
			}, 30000);
		}
	}

	/**
	 * Stop laddering.
	 */
	stopLadder(): void {
		this.isLaddering = false;
		this.currentSearches.clear();

		if (this.ladderInterval) {
			clearInterval(this.ladderInterval);
			this.ladderInterval = null;
		}

		Logger.log('[Ladder] Stopped');
	}

	private maybeStartSearch(): void {
		if (!this.isLaddering) return;

		const currentBattles = this.battles.size;
		const currentSearches = this.currentSearches.size;
		const maxConcurrent = this.config.maxConcurrent ?? 1;

		if (currentBattles + currentSearches >= maxConcurrent) {
			return;
		}

		const formats = this.config.ladderFormats ?? [];
		if (formats.length === 0) return;

		// Pick a random format
		const format = formats[Math.floor(Math.random() * formats.length)];
		this.searchBattle(format);
	}

	/**
	 * Search for a ladder battle.
	 */
	searchBattle(formatId: string): void {
		if (this.currentSearches.has(formatId)) return;

		this.currentSearches.add(formatId);
		this.client.send(`|/search ${formatId}`);

		Logger.log(`[Ladder] Searching ${formatId}`);

		// Remove from searches after timeout
		setTimeout(() => {
			this.currentSearches.delete(formatId);
		}, 60000);
	}

	/**
	 * Cancel current ladder search.
	 */
	cancelSearch(): void {
		this.client.send('|/cancelsearch');
		this.currentSearches.clear();
	}

	// ============ Challenge Handling ============

	/**
	 * Accept a battle challenge.
	 */
	acceptChallenge(user: string, formatId: string): void {
		if (!this.config.acceptChallenges) {
			this.client.send(`|/reject ${user}`);
			Logger.log(`[Challenge] Rejected from ${user} - auto-accept challenges is disabled`);
			const message = "Hi, I'm a bot, and I don't accept challenges. Please challenge a real user instead!";
			this.client.addUser(user).send(message);
			return;
		}
		// Check if we should accept this format
		const acceptFormats = this.config.acceptFormats ?? this.config.ladderFormats ?? ['gen9randombattle'];
		const format = FORMATS[formatId] ?? this.inferFormat(formatId);

		if (!format.isRandom && !acceptFormats.includes(formatId)) {
			Logger.log(`[Challenge] Rejected from ${user} - format ${formatId} not in accept list`);
			this.client.send(`|/reject ${user}`);
			const message =
				acceptFormats.length > 0
					? `Hi, I'm a bot, and I don't accept challenges for this tier. I can fite in ${acceptFormats.list(', ')}.`
					: "Hi, I'm a bot, and I don't accept challenges. Please challenge a real user instead!";
			this.client.addUser(user).send(message);
			return;
		}

		this.client.send(`|/accept ${user}`);
		Logger.log(`[Challenge] Accepted from ${user} for ${formatId}`);
	}

	/**
	 * Challenge a user to a battle.
	 */
	challengeUser(user: string, formatId: string): void {
		this.client.send(`|/challenge ${user}, ${formatId}`);
		Logger.log(`[Challenge] Sent to ${user} for ${formatId}`);
	}

	// ============ Statistics ============

	/**
	 * Get current statistics.
	 */
	getStats(): {
		activeBattles: number;
		searching: string[];
		isLaddering: boolean;
		battlesStarted: number;
		battlesWon: number;
		battlesLost: number;
		winRate: string;
	} {
		const total = this.stats.battlesWon + this.stats.battlesLost;
		const winRate = total > 0 ? ((this.stats.battlesWon / total) * 100).toFixed(1) + '%' : 'N/A';

		return {
			activeBattles: this.battles.size,
			searching: [...this.currentSearches],
			isLaddering: this.isLaddering,
			...this.stats,
			winRate,
		};
	}

	/**
	 * Reset statistics.
	 */
	resetStats(): void {
		this.stats = {
			battlesStarted: 0,
			battlesWon: 0,
			battlesLost: 0,
		};
	}

	/**
	 * Get a specific battle instance.
	 */
	getBattle(roomId: string): Battle | undefined {
		return this.battles.get(roomId);
	}

	/**
	 * Get all active battles.
	 */
	getActiveBattles(): Battle[] {
		return [...this.battles.values()];
	}
}

// Re-export types
export type { DecisionEngine } from '@/ps/battle/decision';
export { Battle } from '@/ps/battle/battle';
export * from '@/ps/battle/types';
