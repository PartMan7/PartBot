import { vi } from 'vitest';

import { jsxToHTML } from '@/utils/jsxToHTML';
import { toId } from '@/utils/toId';

import type { GameUser } from '@/ps/games/game';
import type { Client, User } from 'ps-client';
import type { ReactElement } from 'react';

/**
 * Test double shaped like ps-client `User`: everything game code and command stubs
 * commonly touch, plus HTML/PM stubs so `sendHTML` / message paths don’t blow up.
 */
export type MockUser = GameUser & {
	group: string;
	avatar: string;
	autoconfirmed: boolean;
	alts: Set<string>;
	rooms: Record<string, { isPrivate?: true }> | false;
	parent: Client | null;
	latestPage: string | null;
	send: ReturnType<typeof vi.fn>;
	sendHTML: ReturnType<typeof vi.fn>;
	pageHTML: (html: ReactElement | string, opts?: unknown) => void;
	waitFor: ReturnType<typeof vi.fn>;
	update: ReturnType<typeof vi.fn>;
};

export type MockUserOptions = {
	/** Defaults to `toId(name)`. */
	userid?: string;
	group?: string;
	avatar?: string;
	autoconfirmed?: boolean;
	parent?: Client | null;
};

/**
 * Builds a full mock user without registering it on the test client.
 * Prefer `mockUser()` in tests so `getUser` / `addUser` stay in sync.
 */
export function createMockUser(name: string, options: MockUserOptions = {}): MockUser {
	const userid = options.userid ?? toId(name);
	const id = userid;
	const group = options.group ?? '+';

	const user = {
		id,
		userid,
		name,
		group,
		avatar: options.avatar ?? 'unknown',
		autoconfirmed: options.autoconfirmed ?? true,
		alts: new Set<string>(),
		rooms: {} as Record<string, { isPrivate?: true }>,
		parent: options.parent ?? null,
		latestPage: null as string | null,
		send: vi.fn().mockResolvedValue(undefined),
		sendHTML: vi.fn(() => ''),
		waitFor: vi.fn(),
		update: vi.fn(() => Promise.resolve(null as unknown as User)),
	} as MockUser;

	user.pageHTML = vi.fn((html: ReactElement | string, _opts?: unknown) => {
		user.latestPage = typeof html === 'string' ? html : jsxToHTML(html);
	}) as MockUser['pageHTML'];

	user.update = vi.fn(() => Promise.resolve(user as unknown as User));

	return user;
}

/** Use when a value must be typed as ps-client `User` (e.g. `replacePlayer`). */
export function asPsUser(user: MockUser): User {
	return user as unknown as User;
}
