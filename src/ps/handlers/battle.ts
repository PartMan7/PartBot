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
		const [format, alsoFormatWhatTheHeckIsThis] = message.content.replace('/challenge ', '').lazySplit('|', 2);
		handleChallenge(message.target.id, format);
	}

	// Only handle battle room messages
	const room = message.target;
	if (!room || !room.id.startsWith('battle-')) return;

	// Get the raw line content
	const line = message.raw || message.content;
	if (!line) return;

	// Handle asynchronously but don't block
	battleManager.handleMessage(room, line, message.isIntro).catch(err => {
		if (err instanceof Error) {
			Logger.errorLog(err);
		}
	});
}

/**
 * Raw message handler for battle rooms.
 * Use this for messages that don't go through the normal message handler.
 */
export function battleRawHandler(this: Client, roomId: string, data: string, isIntro: boolean): void {
	if (!battleManager) return;
	if (isIntro) return;
	if (!roomId.startsWith('battle-')) return;

	const room = this.getRoom(roomId);
	if (!room) return;

	// Split data into lines and process each
	const lines = data.split('\n');
	for (const line of lines) {
		if (line) {
			battleManager.handleMessage(room, line, isIntro).catch(err => {
				if (err instanceof Error) Logger.errorLog(err);
			});
		}
	}
}

/**
 * Handle challenges.
 * Call this when receiving a challenge notification.
 */
export function handleChallenge(user: string, format: string): void {
	if (!battleManager) return;
	battleManager.acceptChallenge(user, format);
}
