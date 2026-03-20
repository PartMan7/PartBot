import { client } from '@/ps/__tests__/mocks/client';
import { type MockUser, type MockUserOptions, asPsUser, createMockUser } from '@/ps/__tests__/mocks/usersCore';

export type { MockUser, MockUserOptions };
export { asPsUser, createMockUser };

export type MockUserRegisterOptions = MockUserOptions & {
	/** Override the shared test client (rare). */
	client?: typeof client;
	/** When false, do not insert into `client.userPages` — use for isolated objects. */
	register?: boolean;
};

/**
 * Full ps-client-shaped user for tests, registered on the test client by default
 * so `Client#getUser` / `addUser` resolve to the same object.
 */
export function mockUser(name: string, options: MockUserRegisterOptions = {}): MockUser {
	const { client: clientOverride, register = true, ...userOpts } = options;
	const u = createMockUser(name, userOpts);
	if (register) {
		(clientOverride ?? client).userPages.set(u.userid, u);
	}
	return u;
}
