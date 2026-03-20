import { type MockUser, createMockUser } from '@/ps/__tests__/mocks/usersCore';
import { toId } from '@/utils/toId';

import type { Client } from 'ps-client';

export type { MockUser };

/** @deprecated Use `MockUser` — page user and command author are the same shape now. */
export type MockPageUser = MockUser;

export type MockClient = Pick<Client, 'status'> & {
	addUser: (data: string | { userid: string; name?: string }) => MockUser;
	getUser: (id: string) => MockUser | null;
	userPages: Map<string, MockUser>;
};

const userPages = new Map<string, MockUser>();

export function resetMockClientUsers(): void {
	userPages.clear();
}

function addUser(details: string | { userid: string; name?: string }): MockUser {
	const userid = typeof details === 'string' ? toId(details) : toId(details.userid);
	const existing = userPages.get(userid);
	if (existing) return existing;

	const displayName = typeof details === 'string' ? details : (details.name ?? userid);
	userPages.set(userid, createMockUser(displayName, { userid }));
	return userPages.get(userid)!;
}

function getUser(id: string): MockUser | null {
	return userPages.get(toId(id)) ?? null;
}

export const client: MockClient = {
	status: { userid: 'partbot', username: 'partbot', loggedIn: true as const },
	addUser,
	getUser,
	userPages,
} as unknown as MockClient;
