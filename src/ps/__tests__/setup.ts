import { beforeEach, mock } from 'bun:test';

import '@/globals/prototypes';
import { resetMockClientUsers } from '@/ps/__tests__/mocks/client';

mock.module('@/cache/games', () => ({
	gameCache: { set: mock(), delete: mock(), get: mock(), getByGame: mock(), clearOldBackups: mock() },
}));

process.env.WEB_URL = 'https://partbot.partman.dev';
process.env.PREFIX = ',';

beforeEach(() => {
	resetMockClientUsers();
});
