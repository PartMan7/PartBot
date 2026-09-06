import { beforeEach } from 'vitest';

import { resetMockClientUsers } from '@/ps/__tests__/mocks/client';

process.env.WEB_URL = 'https://partbot.partman.dev';

beforeEach(() => {
	resetMockClientUsers();
});
