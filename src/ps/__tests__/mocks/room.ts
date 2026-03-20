import { vi } from 'vitest';

import type { PSRoomTranslated, TranslatedText } from '@/i18n/types';
import type { MockClient } from '@/ps/__tests__/mocks/client';

export type MockRoom = PSRoomTranslated & {
	id: string;
	sentMessages: TranslatedText[];
};

export function mockRoom(id: string, client: MockClient): MockRoom {
	const sentMessages: TranslatedText[] = [];

	return {
		id,
		parent: client,
		users: [] as string[],
		title: id,
		send: vi.fn((msg: TranslatedText) => {
			sentMessages.push(msg);
			return null;
		}),
		privateSend: vi.fn(() => null),
		sendHTML: vi.fn(() => null),
		pageHTML: vi.fn(() => null),
		sentMessages,
	} as unknown as MockRoom;
}
