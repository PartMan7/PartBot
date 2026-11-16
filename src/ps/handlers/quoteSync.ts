import { toRoomID, unescapeHTML } from 'ps-client/tools';

import { type Model as QuoteModel, replaceRoomQuotes } from '@/database/quotes';
import { escapeRegEx } from '@/utils/regexEscape';

import type { Client } from 'ps-client';

const ranks = ['★', '☆', '^', '⛵', 'ᗢ', '+', '%', '§', '@', '*', '#', '&', '~', '$', '-'].join('');
export const chatRegEx = new RegExp(`^(\\[(?:\\d{2}:){1,2}\\d{2}] )?([${ranks}]?)([a-zA-Z0-9][^:]{0,25}?): (.*)$`);
export const meRegEx = new RegExp(`^(\\[(?:\\d{2}:){1,2}\\d{2}] )?• ([${ranks}]?)(\\[[a-zA-Z0-9][^\\]]{0,25}]) (.*)$`);
export const rawMeRegEx = new RegExp(`^((?:\\[(?:\\d{2}:){1,2}\\d{2}] )?• [${ranks}]?)([a-zA-Z0-9]\\S{0,25})( .*)$`);

const SYNC_TIMEOUT_MS = 10_000;
const PS_QUOTE_EVENT_REGEX =
	/^(?:\/log\s+)?\(?Quote.*was added by|^\/log\s+\(.+? added a new quote: "|^\/log\s+\(.+? removed quote indexed at \d+: /i;

type PageWaiter = {
	resolve: (html: string) => void;
	reject: (err: Error) => void;
	timer: NodeJS.Timeout;
};

const pendingPageWaiters = new Map<string, PageWaiter[]>();
const inFlightSyncs = new Map<string, Promise<QuoteModel[]>>();

export function extractQuoteNames(quote: string): string[] {
	const names: string[] = [];
	for (const line of quote.trim().split(/ {3}|\\n ?|\n/)) {
		const chatName = line.match(chatRegEx)?.[3];
		if (chatName) names.push(chatName);
		const meName = line.match(meRegEx)?.[3];
		if (meName) names.push(meName.slice(1, -1));
	}
	return names.unique();
}

export function parseQuote(quote: string, extraNames: string[] = []): string {
	const lines = quote.trim().split(/ {3}|\\n ?|\n/);
	const foundNames = [
		...lines.map(line => line.match(chatRegEx)?.[3]).filter((name): name is string => !!name),
		...extraNames.filter(Boolean),
	]
		.unique()
		.sort((a, b) => b.length - a.length);
	const reformatRegExes = foundNames.map(name => {
		return new RegExp(`^((?:\\[(?:\\d{2}:){1,2}\\d{2}] )?• [${ranks}]?)(${escapeRegEx(name)})( .*)$`, 'i');
	});
	return lines
		.map(line => {
			// Wrap unspecified /me syntax with a [] if the same username is found elsewhere
			return reformatRegExes.reduce((acc, regEx) => acc.replace(regEx, `$1[$2]$3`), line).replace(rawMeRegEx, '$1[$2]$3');
		})
		.join('\n');
}

export function htmlToPSQuote(rawHtml: string): string {
	let text = rawHtml
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/&laquo;<a href="\/([^"]+)"[^>]*>\1<\/a>&raquo;/gi, '<<$1>>')
		.replace(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_match, href: string, inner: string) => {
			const cleaned = inner
				.replace(/<small class="message-overflow">([\s\S]*?)<\/small>/gi, '$1')
				.replace(/<small>\s*&lt;[^<]*&gt;<\/small>/gi, '')
				.replace(/<\/?[^>]+>/g, '');
			const decodedHref = unescapeHTML(href);
			const decodedText = unescapeHTML(cleaned);
			if (
				decodedText === decodedHref ||
				decodedHref === `http://${decodedText}` ||
				decodedHref.replace(/^https?:\/\//, '') === decodedText
			) {
				return decodedHref;
			}
			return `[[${decodedText} <${decodedHref}>]]`;
		})
		.replace(/<psicon [^>]*\b(?:pokemon|item|type|category)="([^"]+)"[^>]*\/?>/gi, ':$1:');

	let prev: string;
	do {
		prev = text;
		text = text
			.replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**')
			.replace(/<i>([\s\S]*?)<\/i>/gi, '__$1__')
			.replace(/<s>([\s\S]*?)<\/s>/gi, '~~$1~~')
			.replace(/<sup>([\s\S]*?)<\/sup>/gi, '^^$1^^')
			.replace(/<sub>([\s\S]*?)<\/sub>/gi, '\\\\$1\\\\')
			.replace(/<code>([\s\S]*?)<\/code>/gi, '``$1``')
			.replace(/<span class="spoiler(?:-shown)?">([\s\S]*?)<\/span>/gi, '||$1||')
			.replace(/<span class="greentext">([\s\S]*?)<\/span>/gi, '$1');
	} while (text !== prev);

	text = text.replace(/<\/?(?:tt|strong|small|u|span)(?: [^>]*)?>/gi, '');
	return unescapeHTML(text);
}

export function parsePSTimestamp(ts: string): Date {
	const match = ts.trim().match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(am|pm)?$/i);
	if (!match) return new Date();
	const [, yearStr, monthStr, dayStr, hourStr, minStr, secStr, meridiem] = match;
	let hour = parseInt(hourStr, 10);
	if (meridiem) {
		const isPm = meridiem.toLowerCase() === 'pm';
		if (hour === 12) hour = isPm ? 12 : 0;
		else if (isPm) hour += 12;
	}
	return new Date(
		Date.UTC(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10), hour, parseInt(minStr, 10), parseInt(secStr, 10))
	);
}

export function parsePSQuotesHTML(html: string): Array<Pick<QuoteModel, 'quote' | 'addedBy' | 'at'>> {
	if (html.includes('<h2>This room has no quotes.</h2>')) return [];
	if (!/<h2>Quotes for /.test(html)) {
		throw new Error('Unexpected PS quotes HTML page');
	}

	const entries: Array<Pick<QuoteModel, 'quote' | 'addedBy' | 'at'>> = [];
	const boxRegEx = new RegExp(
		[
			'<div class="infobox">#\\d+: ([\\s\\S]*?)<br\\s*\\/?>\\s*<hr\\s*\\/?>\\s*',
			'<small>Added by ([^<]+?) on ([^<]+?)<\\/small>',
			'(?:\\s*<button[^>]*>[\\s\\S]*?<\\/button>)?<\\/div>',
		].join(''),
		'g'
	);

	let match: RegExpExecArray | null;
	while ((match = boxRegEx.exec(html)) !== null) {
		entries.push({
			quote: htmlToPSQuote(match[1]),
			addedBy: unescapeHTML(match[2].trim()),
			at: parsePSTimestamp(match[3]),
		});
	}
	return entries;
}

export function isPSQuoteAddMessage(content: string): boolean {
	return PS_QUOTE_EVENT_REGEX.test(content.trim());
}

function resolvePageWaiters(client: Client, room: string, html: string): void {
	const waiters = pendingPageWaiters.get(room);
	if (!waiters?.length) return;
	pendingPageWaiters.delete(room);
	for (const waiter of waiters) {
		clearTimeout(waiter.timer);
		waiter.resolve(html);
	}
	client.send(`|/leave ${room}`);
}

function rejectPageWaiters(room: string, err: Error): void {
	const waiters = pendingPageWaiters.get(room);
	if (!waiters?.length) return;
	pendingPageWaiters.delete(room);
	for (const waiter of waiters) {
		clearTimeout(waiter.timer);
		waiter.reject(err);
	}
}

export function packetHandler(this: Client, direction: 'in' | 'out', data: string): void {
	if (direction !== 'in' || pendingPageWaiters.size === 0 || !data.startsWith('a')) return;
	let chunks: unknown;
	try {
		chunks = JSON.parse(data.slice(1));
	} catch {
		return;
	}
	if (!Array.isArray(chunks)) return;

	for (const chunk of chunks) {
		if (typeof chunk !== 'string' || !chunk) continue;
		const lines = chunk.split('\n');
		const room = lines[0]?.startsWith('>') ? lines.shift()!.slice(1) || 'lobby' : 'lobby';
		if (!pendingPageWaiters.has(room)) continue;

		for (const line of lines) {
			if (line.startsWith('|pagehtml|')) {
				resolvePageWaiters(this, room, line.slice('|pagehtml|'.length));
				break;
			}
			if (line.startsWith('|noinit|')) {
				rejectPageWaiters(room, new Error(`Unable to open ${room}: ${line.slice('|noinit|'.length)}`));
				break;
			}
		}
	}
}

function requestQuotesPage(client: Client, roomId: string): Promise<string> {
	const pageRoom = `view-quotes-${roomId}`;
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			const list = pendingPageWaiters.get(pageRoom);
			if (list) {
				const remaining = list.filter(entry => entry.timer !== timer);
				if (remaining.length > 0) pendingPageWaiters.set(pageRoom, remaining);
				else pendingPageWaiters.delete(pageRoom);
			}
			reject(new Error(`Timed out waiting for ${pageRoom}`));
		}, SYNC_TIMEOUT_MS);

		const waiters = pendingPageWaiters.get(pageRoom) ?? [];
		waiters.push({ resolve, reject, timer });
		pendingPageWaiters.set(pageRoom, waiters);
		client.send(`|/join ${pageRoom}`);
	});
}

export async function syncRoomQuotes(client: Client, room: string): Promise<QuoteModel[]> {
	const roomId = toRoomID(room);
	const existing = inFlightSyncs.get(roomId);
	if (existing) return existing;

	const syncPromise = (async () => {
		const html = await requestQuotesPage(client, roomId);
		const rawEntries = parsePSQuotesHTML(html);
		const allNames = rawEntries.flatMap(entry => extractQuoteNames(entry.quote)).unique();
		const parsedEntries = rawEntries.map(entry => ({
			...entry,
			quote: parseQuote(entry.quote, allNames),
		}));
		return replaceRoomQuotes(roomId, parsedEntries);
	})().finally(() => {
		inFlightSyncs.delete(roomId);
	});

	inFlightSyncs.set(roomId, syncPromise);
	return syncPromise;
}
