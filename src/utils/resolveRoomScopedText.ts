import type { RoomScopedText } from '@/types/chat';

export function resolveRoomScopedText(text: string | RoomScopedText, room?: string): string {
	if (typeof text === 'string') return text;
	if (room && room in text) return text[room];
	return text.default;
}
