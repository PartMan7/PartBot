import { PSActiveRepeats } from '@/cache';
import { fetchRepeats } from '@/database/repeats';
import { Logger } from '@/utils/logger';

import type { NoTranslate } from '@/i18n/types';
import type { PSRepeat } from '@/types/ps';
import type { Client } from 'ps-client';

function getRepeatKey(room: string, id: string): string {
	return `${room}:${id}`;
}

export function startRepeat(PS: Client, repeat: PSRepeat, delay: number | null) {
	const key = getRepeatKey(repeat.room, repeat.id);
	if (PSActiveRepeats.has(key)) {
		clearInterval(PSActiveRepeats.get(key)!);
	}

	const handler = () => {
		if (PS.status.connected && PS.status.loggedIn) {
			PS.getRoom(repeat.room)?.send(repeat.content as NoTranslate);
		}
	};

	if (typeof delay === 'number') {
		const timeout = setTimeout(() => {
			handler();
			const interval = setInterval(handler, repeat.interval);
			PSActiveRepeats.set(key, interval);
		}, delay);
		PSActiveRepeats.set(key, timeout);
	} else {
		const interval = setInterval(handler, repeat.interval);
		PSActiveRepeats.set(key, interval);
	}
}

export function stopRepeat(room: string, id: string) {
	const key = getRepeatKey(room, id);
	const interval = PSActiveRepeats.get(key);
	if (interval) {
		clearTimeout(interval);
		PSActiveRepeats.delete(key);
		return true;
	}
	return false;
}

export async function loadRepeats(PS: Client) {
	const repeats = await fetchRepeats();
	const now = Date.now();
	for (const repeat of repeats) {
		const delay = repeat.interval - ((now - repeat.startedAt) % repeat.interval);
		startRepeat(PS, repeat, delay);
	}
	Logger.log(`Loaded ${repeats.length} repeats`);
}

export function clearAllRepeats() {
	for (const interval of PSActiveRepeats.values()) {
		clearInterval(interval);
	}
	PSActiveRepeats.clear();
	Logger.log('Cleared all active repeats');
}
