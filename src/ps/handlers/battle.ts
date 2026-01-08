/**
 * Battle handler for Pokemon Showdown.
 * Handles all battle-related messages and routes them to the BattleManager.
 */

import { BattleManager } from '@/ps/battle';
import { registerBattleEvents } from '@/ps/battle/parser';
import { Logger } from '@/utils/logger';

import type { BattleManagerConfig } from '@/ps/battle';
import type { PSMessage } from '@/types/ps';
import type { Client } from 'ps-client';

// Singleton battle manager instance
let battleManager: BattleManager | null = null;

/**
 * Initialize the battle manager.
 * Call this before handling any battle messages.
 */
export function initBattleManager(client: Client, config?: BattleManagerConfig): BattleManager {
	if (battleManager) {
		Logger.log('[Battle] Manager already initialized');
		return battleManager;
	}

	battleManager = new BattleManager(client, config);
	Logger.log('[Battle] Manager initialized');

	registerBattleEvents(client);
	Logger.log('[Battle] Events registered');

	return battleManager;
}

/**
 * Get the battle manager instance.
 */
export function getBattleManager(): BattleManager | null {
	return battleManager;
}

/**
 * Main battle message handler.
 * Registers as a PS message handler.
 */
export function battleHandler(message: PSMessage): void {
	// Skip if battle manager not initialized
	if (!battleManager) return;

	// Skip intro messages
	if (message.isIntro) return;

	if (message.type === 'pm' && message.author.id !== message.parent.status.userid && message.command === '/challenge') {
		const [format, _alsoFormatWhatTheHeckIsThis] = message.content.replace('/challenge ', '').lazySplit('|', 2);
		battleManager.acceptChallenge(message.target.id, format);
	}
}
