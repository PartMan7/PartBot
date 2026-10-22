import { PSCommandCooldowns } from '@/cache';
import { ChatError } from '@/utils/chatError';

import type { TranslationFn } from '@/i18n/types';

function cooldownKey(userId: string, scope: string, command: string) {
	return `${userId}|${scope}|${command}`;
}

export function checkCooldown(userId: string, scope: string, command: string, $T: TranslationFn): void {
	const until = PSCommandCooldowns[cooldownKey(userId, scope, command)];
	if (until !== undefined && until > Date.now()) throw new ChatError($T('COOLING_DOWN'));
}

export function setCooldown(userId: string, scope: string, command: string, cooldownMs: number): void {
	PSCommandCooldowns[cooldownKey(userId, scope, command)] = Date.now() + cooldownMs;
}
