import { mock } from 'bun:test';

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
		send: mock((msg: TranslatedText) => {
			sentMessages.push(msg);
			return null;
		}),
		privateSend: mock(() => null),
		sendHTML: mock(() => null),
		pageHTML: mock(() => null),
		sentMessages,
	} as unknown as MockRoom;
}
