import { describe, expect, it } from 'bun:test';

import { password } from '@/config/ps';

describe('test env isolation', () => {
	it('does not load PS_PASSWORD from a developer .env file', () => {
		expect(password).toBe('password');
	});
});
