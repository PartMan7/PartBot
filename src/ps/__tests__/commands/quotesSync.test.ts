import { afterEach, describe, expect, it, vi } from 'vitest';

import { PSRoomConfigs } from '@/cache';
import * as QuotesDB from '@/database/quotes';
import { mockT } from '@/ps/__tests__/helpers/games';
import { createMockUser } from '@/ps/__tests__/mocks/user';
import { command as quotesCommands } from '@/ps/commands/quotes';
import { otherHandler } from '@/ps/handlers/other';
import {
	htmlToPSQuote,
	isPSQuoteAddMessage,
	pageHtmlHandler,
	parsePSQuotesHTML,
	parsePSTimestamp,
	syncRoomQuotes,
} from '@/ps/handlers/quoteSync';
import { ChatError } from '@/utils/chatError';
import { jsxToHTML } from '@/utils/jsxToHTML';

import type { NoTranslate } from '@/i18n/types';
import type { PSCommandContext } from '@/types/chat';
import type { PSMessage } from '@/types/ps';
import type { Client } from 'ps-client';
import type { ReactElement } from 'react';

function createFakePSClient() {
	const sent: string[] = [];
	const client = {
		status: { userid: 'partbot', username: 'PartBot', loggedIn: true },
		send: vi.fn((raw: string) => {
			sent.push(raw);
		}),
	} as unknown as Client & { sent: string[] };
	return { client, sent };
}

describe('PS quotes sync parser', () => {
	it('parses an empty PS quotes page to an empty list', () => {
		const html =
			'<div class="pad"><button style="float:right;" class="button" name="send" value="/join view-quotes-lobby">' +
			'<i class="fa fa-refresh"></i> Refresh</button><h2>This room has no quotes.</h2></div>';
		expect(parsePSQuotesHTML(html)).toEqual([]);
	});

	it('throws on invalid or access-denied PS quotes pages', () => {
		expect(() => parsePSQuotesHTML('<div class="pad"><p class="error">Access denied.</p></div>')).toThrow();
	});

	it('converts PS formatted quote HTML back into raw quote syntax', () => {
		const formatted =
			'[12:00:00] <b>PartMan</b>: <i>hi</i> <s>old</s> <code>cmd</code> &amp; &lt;tag&gt;<br />' +
			'<span class="greentext">&gt;greentext</span> <span class="spoiler">secret</span> ' +
			'&laquo;<a href="/boardgames" target="_blank">boardgames</a>&raquo; ' +
			'<a href="https://example.com" rel="noopener" target="_blank">example.com</a>';
		expect(htmlToPSQuote(formatted)).toBe(
			'[12:00:00] **PartMan**: __hi__ ~~old~~ ``cmd`` & <tag>\n>greentext ||secret|| <<boardgames>> https://example.com'
		);
	});

	it('parses PS timestamps with 12-hour am/pm formatting in UTC', () => {
		expect(parsePSTimestamp('2025-10-31 12:05:09am').toISOString()).toBe('2025-10-31T00:05:09.000Z');
		expect(parsePSTimestamp('2025-10-31 12:05:09pm').toISOString()).toBe('2025-10-31T12:05:09.000Z');
		expect(parsePSTimestamp('2025-10-31 06:02:13pm').toISOString()).toBe('2025-10-31T18:02:13.000Z');
	});

	it('parses multiple infoboxes from PS view-quotes HTML', () => {
		const html =
			'<div class="pad"><h2>Quotes for Board Games (2):</h2>' +
			'<div class="infobox">#1: [14:20:21] #PartMan: hello<br /><hr />' +
			'<small>Added by partman on 2025-10-31 02:20:21pm</small></div>' +
			'<div class="infobox">#2: [14:25:00] • #PartMan hugs Hydro<br /><hr />' +
			'<small>Added by hydro on 2025-10-31 02:25:00pm</small> ' +
			'<button class="button" name="send" value="/msgroom boardgames,/removequote 2">Remove</button></div>' +
			'</div>';

		const parsed = parsePSQuotesHTML(html);
		expect(parsed).toHaveLength(2);
		expect(parsed[0]).toEqual({
			quote: '[14:20:21] #PartMan: hello',
			addedBy: 'partman',
			at: new Date('2025-10-31T14:20:21.000Z'),
		});
		expect(parsed[1]).toEqual({
			quote: '[14:25:00] • #PartMan hugs Hydro',
			addedBy: 'hydro',
			at: new Date('2025-10-31T14:25:00.000Z'),
		});
	});
});

describe('PS quotes sync integration', () => {
	afterEach(() => {
		vi.restoreAllMocks();
		Object.keys(PSRoomConfigs).forEach(key => delete PSRoomConfigs[key]);
	});

	it('uses names from every synced quote when wrapping /me [name] syntax', async () => {
		const replaceSpy = vi.spyOn(QuotesDB, 'replaceRoomQuotes').mockResolvedValue([]);
		const { client, sent } = createFakePSClient();

		const syncPromise = syncRoomQuotes(client, 'boardgames');
		expect(sent).toEqual(['|/join view-quotes-boardgames']);

		const pageHtml =
			'<div class="pad"><h2>Quotes for Board Games (2):</h2>' +
			'<div class="infobox">#1: [14:20:21] #Part Man: hello<br /><hr />' +
			'<small>Added by partman on 2025-10-31 02:20:21pm</small></div>' +
			'<div class="infobox">#2: [14:25:00] • #Part Man hugs Hydro<br /><hr />' +
			'<small>Added by hydro on 2025-10-31 02:25:00pm</small></div>' +
			'</div>';
		pageHtmlHandler.call(client, 'view-quotes-boardgames', pageHtml, false);

		const result = await syncPromise;
		expect(sent).toContain('|/leave view-quotes-boardgames');
		expect(replaceSpy).toHaveBeenCalledTimes(1);
		expect(replaceSpy.mock.calls[0][0]).toBe('boardgames');
		expect(replaceSpy.mock.calls[0][1][1].quote).toBe('[14:25:00] • #[Part Man] hugs Hydro');
		expect(result).toEqual([]);
	});

	it('detects PS quote-added messages and triggers sync only when quoteSync is enabled', () => {
		expect(isPSQuoteAddMessage('Quote "hi" was added by PartMan.')).toBe(true);
		expect(isPSQuoteAddMessage('/log (PartMan added a new quote: "hi".)')).toBe(true);
		expect(isPSQuoteAddMessage('Hello everyone')).toBe(false);

		const { client, sent } = createFakePSClient();
		const baseMsg = {
			isIntro: false,
			type: 'chat',
			author: { userid: 'partman', id: 'partman', name: 'PartMan' },
			target: { id: 'boardgames' },
			parent: client,
			content: 'Quote #1 was added by PartMan.',
		} as unknown as PSMessage;

		otherHandler(baseMsg);
		expect(sent).toHaveLength(0);

		PSRoomConfigs.boardgames = { roomId: 'boardgames', quoteSync: true };
		vi.spyOn(QuotesDB, 'replaceRoomQuotes').mockResolvedValue([]);
		otherHandler(baseMsg);
		expect(sent).toEqual(['|/join view-quotes-boardgames']);

		// Complete pending waiter so it doesn't linger
		pageHtmlHandler.call(client, 'view-quotes-boardgames', '<div class="pad"><h2>This room has no quotes.</h2></div>', false);
	});

	it('blocks direct quote add in quoteSync rooms and sends an HTML button to add on PS', async () => {
		PSRoomConfigs.boardgames = { roomId: 'boardgames', quoteSync: true };
		const addSpy = vi.spyOn(QuotesDB, 'addQuote');
		const quoteCmd = quotesCommands[0];
		const user = createMockUser('PartMan');
		const replyHTML = vi.fn((html: ReactElement) => jsxToHTML(html));
		const { client } = createFakePSClient();

		const message = {
			type: 'chat',
			author: user,
			target: { id: 'boardgames', roomid: 'boardgames' },
			parent: client,
			replyHTML,
		} as unknown as PSMessage;

		await expect(
			quoteCmd.children!.add.run({
				message,
				arg: 'hello\\nworld',
				$T: mockT,
				broadcast: vi.fn(),
				broadcastHTML: vi.fn(),
				run: vi.fn(),
				unsafeRun: vi.fn(),
				hasFeature: vi.fn(),
				canFullHTML: vi.fn(),
				checkPermissions: vi.fn(),
				originalCommand: 'quote add',
				command: ['quotes', 'add'],
				calledFrom: [],
			} as unknown as PSCommandContext)
		).rejects.toThrow(new ChatError(mockT('COMMANDS.QUOTES.SYNC_ADD_ON_PS')));

		expect(addSpy).not.toHaveBeenCalled();
		expect(replyHTML).toHaveBeenCalledTimes(1);
		const rendered = jsxToHTML(replyHTML.mock.calls[0][0]);
		expect(rendered).toContain('name="send"');
		expect(rendered).toContain('/addquote hello world');
	});

	it('runs sync via `,quote sync` and errors when quoteSync is disabled', async () => {
		const quoteCmd = quotesCommands[0];
		const { client } = createFakePSClient();
		const replies: string[] = [];
		const message = {
			type: 'chat',
			author: createMockUser('PartMan'),
			target: { id: 'boardgames', roomid: 'boardgames' },
			parent: client,
			reply: vi.fn((text: NoTranslate) => {
				replies.push(text);
			}),
		} as unknown as PSMessage;

		const ctx = {
			message,
			arg: '',
			$T: mockT,
			broadcast: vi.fn(),
			broadcastHTML: vi.fn(),
			run: vi.fn(),
			unsafeRun: vi.fn(),
			hasFeature: vi.fn(),
			canFullHTML: vi.fn(),
			checkPermissions: vi.fn(),
			originalCommand: 'quote sync',
			command: ['quotes', 'sync'],
			calledFrom: [],
		} as unknown as PSCommandContext;

		await expect(quoteCmd.children!.sync.run(ctx)).rejects.toThrow(new ChatError(mockT('COMMANDS.QUOTES.SYNC_NOT_ENABLED')));

		PSRoomConfigs.boardgames = { roomId: 'boardgames', quoteSync: true };
		vi.spyOn(QuotesDB, 'replaceRoomQuotes').mockResolvedValue([
			{ quote: 'test', rawText: 'test', room: 'boardgames', addedBy: 'partman', addedById: 'partman', at: new Date() },
		]);

		const runPromise = quoteCmd.children!.sync.run(ctx);
		pageHtmlHandler.call(
			client,
			'view-quotes-boardgames',
			'<div class="pad"><h2>Quotes for Board Games (1):</h2><div class="infobox">#1: test<br /><hr />' +
				'<small>Added by partman on 2025-10-31 02:20:21pm</small></div></div>',
			false
		);
		await runPromise;

		expect(replies).toEqual([mockT('COMMANDS.QUOTES.SYNCED_SINGULAR', { count: 1 })]);
	});
});
