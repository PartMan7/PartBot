import { afterEach, describe, expect, it, vi } from 'vitest';

import { PSCommandCooldowns } from '@/cache';
import { mockT } from '@/ps/__tests__/helpers/games';
import { checkCooldown, setCooldown } from '@/ps/handlers/commands/cooldown';
import { ChatError } from '@/utils/chatError';

describe('command cooldowns', () => {
	afterEach(() => {
		vi.useRealTimers();
		Object.keys(PSCommandCooldowns).forEach(key => delete PSCommandCooldowns[key]);
	});

	it('throws while the cooldown is active', () => {
		vi.useFakeTimers();
		vi.setSystemTime(0);
		setCooldown('user', 'room', 'egg', 1000);
		expect(() => checkCooldown('user', 'room', 'egg', mockT)).toThrowError(new ChatError(mockT('COOLING_DOWN')));
	});

	it('allows use after the cooldown expires', () => {
		vi.useFakeTimers();
		vi.setSystemTime(0);
		setCooldown('user', 'room', 'egg', 1000);
		vi.setSystemTime(1000);
		expect(() => checkCooldown('user', 'room', 'egg', mockT)).not.toThrow();
	});

	it('scopes cooldowns by user, room, and command', () => {
		vi.useFakeTimers();
		vi.setSystemTime(0);
		setCooldown('user', 'room', 'egg', 1000);
		expect(() => checkCooldown('other', 'room', 'egg', mockT)).not.toThrow();
		expect(() => checkCooldown('user', 'other', 'egg', mockT)).not.toThrow();
		expect(() => checkCooldown('user', 'room', 'toss', mockT)).not.toThrow();
	});
});
