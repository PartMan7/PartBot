import { escapeHTML, formatText, toRoomID } from 'ps-client/tools';
import { Temporal } from '@js-temporal/polyfill';

import { PSQuoteRoomPrefs } from '@/cache';
import { isGlobalBot, prefix } from '@/config/ps';
import { type Model as QuoteModel, addQuote, deleteQuoteByIndex, getAllQuotes, quoteToTerms } from '@/database/quotes';
import { MAX_CHAT_HTML_LENGTH } from '@/ps/constants';
import { ChatError } from '@/utils/chatError';
import { Username as UsernameCustom } from '@/utils/components';
import { Button, Username as UsernamePS } from '@/utils/components/ps';
import { fromHumanTime } from '@/utils/humanTime';
import { jsxToHTML } from '@/utils/jsxToHTML';
import { Logger } from '@/utils/logger';
import { pluralize } from '@/utils/pluralize';
import { escapeRegEx } from '@/utils/regexEscape';
import { toId } from '@/utils/toId';

import type { ToTranslate, TranslationFn } from '@/i18n/types';
import type { PSCommand } from '@/types/chat';
import type { PSMessage } from '@/types/ps';
import type { CSSProperties, ReactElement, ReactNode } from 'react';

type IndexedQuoteModel = [index: number, quote: QuoteModel];

const PAGE_SIZE = 50;
const MAX_QUOTE_LENGTH = (MAX_CHAT_HTML_LENGTH / PAGE_SIZE) * 2; // Leniency margin of 2x

const getCommand = (baseCmd: string, message: PSMessage) => {
	const content = `/botmsg ${message.parent.status.userid},${prefix}@${message.target.roomid} ${baseCmd}`;
	if (isGlobalBot) return content;
	return `/msgroom ${message.target.roomid},${content}`;
};

const ranks = ['★', '☆', '^', '⛵', 'ᗢ', '+', '%', '§', '@', '*', '#', '&', '~', '$', '-'].join('');
const chatRegEx = new RegExp(`^(\\[(?:\\d{2}:){1,2}\\d{2}] )?([${ranks}]?)([a-zA-Z0-9][^:]{0,25}?): (.*)$`);
const meRegEx = new RegExp(`^(\\[(?:\\d{2}:){1,2}\\d{2}] )?• ([${ranks}]?)(\\[[a-zA-Z0-9][^\\]]{0,25}]) (.*)$`);
const rawMeRegEx = new RegExp(`^((?:\\[(?:\\d{2}:){1,2}\\d{2}] )?• [${ranks}]?)([a-zA-Z0-9]\\S{0,25})( .*)$`);
const jnlRegEx = /^(?:.*? (?:joined|left)(?:; )?){1,2}$/;
const rawRegEx = /^(\[(?:\d{2}:){1,2}\d{2}] )?(.*)$/;

async function getRoom(givenRoom: unknown, message: PSMessage, $T: TranslationFn): Promise<string> {
	if (typeof givenRoom === 'string') return givenRoom;
	if (message.type === 'chat') return message.target.roomid;
	const prefs = PSQuoteRoomPrefs[message.author.userid];
	if (prefs && message.time - prefs.at.getTime() < fromHumanTime('1 hour')) return prefs.room;
	message.reply(`Which room are you looking for a quote in?`);
	const answer = await message.target
		.waitFor(msg => {
			return msg.content.length > 0 && !!msg.parent.getRoom(msg.content);
		})
		.catch(() => {
			throw new ChatError($T('COMMANDS.ROOM_NOT_GIVEN'));
		});
	const _room = toRoomID(answer.content);
	PSQuoteRoomPrefs[message.author.userid] = { room: _room, at: new Date() };
	return _room;
}

function getQuoteSearchWeight(quote: QuoteModel, singleTerm: string, terms: string[]): number {
	if (quote.rawText.includes(singleTerm)) return 3;
	const quoteTerms = quote.rawText.split(' ');
	if (terms.every(term => quoteTerms.includes(term))) return 2;
	if (terms.some(term => quoteTerms.includes(term))) return 1;
	return 0;
}

function searchQuotes(quotes: IndexedQuoteModel[], arg: string): IndexedQuoteModel[] {
	const singleTerm = quoteToTerms(arg).trim();
	if (!singleTerm) return quotes;
	const terms = singleTerm.split(' ');

	const weights = quotes.map(([index, quote]) => ({ weight: getQuoteSearchWeight(quote, singleTerm, terms), index, quote }));

	const max = Math.max(...weights.map(({ weight }) => weight));
	if (max === 0) return [];
	return weights.filter(({ weight }) => weight === max).map(({ quote, index }) => [index, quote]);
}

function parseQuote(quote: string): string {
	const lines = quote.trim().split(/ {3}|\\n|\n/);
	const foundNames = lines
		.map(line => line.match(chatRegEx)?.[3])
		.filter((name): name is string => !!name)
		.unique();
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

function FormatQuoteLine({ line, style, psUsernameTag }: { line: string; style?: CSSProperties; psUsernameTag?: boolean }): ReactNode {
	const chatMatch = line.match(chatRegEx);
	if (chatMatch) {
		const chatMessage = formatText(' ' + chatMatch[4]);
		return (
			<div className="chat chatmessage-a" style={style ?? { padding: '3px 0' }}>
				<small>
					{chatMatch[1]}
					{chatMatch[2]}
				</small>
				<span className="username">
					{psUsernameTag ? <UsernamePS name={`${chatMatch[3]}:`} /> : <UsernameCustom name={`${chatMatch[3]}:`} />}
				</span>
				<em
					dangerouslySetInnerHTML={{
						__html: chatMatch[4].startsWith('>') ? `<span class="greentext">${chatMessage}</span>` : chatMessage,
					}}
				/>
			</div>
		);
	}

	const meMatch = line.match(meRegEx);
	if (meMatch)
		return (
			<div className={`chat chatmessage-${toId(meMatch[3])}`} style={style ?? { padding: '3px 0' }}>
				<small>{meMatch[1]}</small>
				<UsernameCustom name={meMatch[3]}>• </UsernameCustom>
				<em>
					<small>{meMatch[2]}</small>
					<span className="username">{meMatch[3].slice(1, -1)}</span>
					<i dangerouslySetInnerHTML={{ __html: formatText(' ' + meMatch[4]) }} />
				</em>
			</div>
		);

	const jnlMatch = line.match(jnlRegEx);
	if (jnlMatch)
		return (
			<div className="message" style={style ?? { padding: '3px 0' }}>
				<small style={{ color: '#555555' }}>
					{jnlMatch[0]}
					<br />
				</small>
			</div>
		);

	const rawMatch = line.match(rawRegEx);
	if (rawMatch)
		return (
			<div
				className="chat chatmessage-partbot"
				style={style ?? { padding: '3px 0' }}
				dangerouslySetInnerHTML={{ __html: `<small>${escapeHTML(rawMatch[1] ?? '')}</small>` + formatText(rawMatch[2]) }}
			/>
		);

	return undefined;
}

function FormatQuote({
	quote,
	psUsernameTag = true,
	header,
	addedBy,
	dateAdded,
}: {
	quote: string;
	psUsernameTag?: boolean;
	addedBy?: string;
	dateAdded?: string;
	header?: ReactNode;
	children?: ReactElement[];
}): ReactElement {
	const quoteLines = quote.split('\n');
	return (
		<>
			<div style={{ opacity: 0.78 }}>{header}</div>
			<div style={{ marginLeft: 12 }}>
				{quoteLines.length > 5 ? (
					<details className="readmore">
						<summary>
							{quoteLines.slice(0, 2).map(line => (
								<FormatQuoteLine line={line} psUsernameTag={psUsernameTag} />
							))}
							<FormatQuoteLine
								line={quoteLines[2]}
								psUsernameTag={psUsernameTag}
								style={{ padding: '3px 0', display: 'inline-block' }}
							/>
						</summary>
						{quoteLines.slice(3).map(line => (
							<FormatQuoteLine line={line} psUsernameTag={psUsernameTag} />
						))}
					</details>
				) : (
					quoteLines.map(line => <FormatQuoteLine line={line} psUsernameTag={psUsernameTag} />)
				)}
			</div>
			{addedBy && dateAdded && (
				<>
					<span style={{ fontSize: 10, opacity: 0.6, marginTop: 6 }}>Added by&nbsp;</span>
					<UsernamePS name={addedBy} style={{ fontSize: 10 }} clickable />
					<span style={{ fontSize: 10, opacity: 0.6, marginTop: 6 }}>&nbsp;on {dateAdded}</span>
				</>
			)}
		</>
	);
}

function _FormatSmogQuote(quote: string): string {
	return quote
		.split('\n')
		.map(line => {
			switch (true) {
				case chatRegEx.test(line): {
					//
				}
			}
		})
		.join('\n');
}

function MultiQuotes({
	list,
	pageNum,
	total,
	command,
	title: baseTitle,
	showAll = false,
}: {
	list: IndexedQuoteModel[];
	pageNum: number | null;
	total: number;
	command: string | null;
	title?: string;
	showAll?: boolean;
}): ReactElement {
	const useDropdown = !showAll && list.length > 3;
	const pageCount = Math.ceil(total / PAGE_SIZE);
	const suffix = `(${pluralize(list.length, {
		singular: 'quote',
		plural: 'quotes',
	})}${total > list.length ? ` of ${total} total` : ''})`;
	const title = baseTitle ? `${baseTitle} ${suffix}` : pageNum ? `Page ${pageNum} of ${pageCount} ${suffix}` : `All Quotes`;
	const quotes = list
		.map(([index, quote]) => {
			const dateAdded = Temporal.Instant.fromEpochMilliseconds(quote.at.getTime())
				.toZonedDateTimeISO('UTC')
				.toPlainDate()
				.toLocaleString('en-GB');

			return <FormatQuote quote={quote.quote} header={`#${index}`} addedBy={quote.addedBy} dateAdded={dateAdded} />;
		})
		.space(<hr />, !useDropdown);

	const content = useDropdown ? (
		<>
			<hr />
			<details>
				<summary>
					<h3 style={{ display: 'inline-block' }}>{title}</h3>
				</summary>
				<hr />
				<>{quotes}</>
			</details>
			<hr />
		</>
	) : (
		<>{quotes}</>
	);

	const showNav = command && pageCount && pageNum;
	const navPanel = showNav ? (
		<div style={{ margin: '4px 8px' }}>
			{pageNum > 1 ? (
				<Button name="send" value={`${command} ${pageNum - 1}`}>
					Previous
				</Button>
			) : null}
			{pageNum < pageCount ? (
				<Button name="send" value={`${command} ${pageNum + 1}`}>
					Next
				</Button>
			) : null}
		</div>
	) : null;

	return (
		<div style={{ margin: '4px 8px' }} className={showAll ? 'chat' : undefined}>
			{showAll && showNav ? [<hr />, navPanel, <hr />, <h3>{title}</h3>] : null}
			{content}
			{showNav ? [navPanel, <hr />] : null}
		</div>
	);
}

export const command: PSCommand = {
	name: 'quotes',
	aliases: ['q', 'quote'],
	flags: { allowPMs: true },
	help: 'Quotes module!',
	syntax: 'CMD',
	categories: ['utility'],
	extendedAliases: {
		addquote: ['quotes', 'add'],
	},
	children: {
		help: {
			name: 'help',
			aliases: ['h'],
			help: null,
			flags: { noDisplay: true },
			syntax: 'CMD',
			async run({ run }) {
				return run('help quotes');
			},
		},
		random: {
			name: 'random',
			aliases: ['rand', 'r'],
			help: 'Displays a random quote.',
			syntax: 'CMD',
			async run({ message, arg, broadcast, broadcastHTML, room: givenRoom, $T }) {
				const room: string = await getRoom(givenRoom, message, $T);
				const quotes = await getAllQuotes(room);
				if (!quotes.length) return broadcast($T('COMMANDS.QUOTES.NO_QUOTES_FOUND'));
				const matchingQuotes = searchQuotes(
					quotes.map<IndexedQuoteModel>((quote, index) => [index + 1, quote]),
					arg
				);
				if (!matchingQuotes.length) return broadcast($T('COMMANDS.QUOTES.NO_QUOTES_FOUND_MATCHING', { search: arg }));
				const [index, randQuote] = matchingQuotes.random()!;
				const dateAdded = Temporal.Instant.fromEpochMilliseconds(randQuote.at.getTime())
					.toZonedDateTimeISO('UTC')
					.toPlainDate()
					.toLocaleString('en-GB');

				broadcastHTML(
					<>
						<hr />
						<FormatQuote quote={randQuote.quote} header={`#${+index + 1}`} addedBy={randQuote.addedBy} dateAdded={dateAdded} />
						<hr />
					</>,
					{ name: `viewquote-${message.parent.status.userid}` }
				);
			},
		},
		add: {
			name: 'add',
			aliases: ['new', 'a', 'n'],
			perms: 'driver',
			flags: { allowPMs: false },
			help:
				'Adds the given quote. ``\\n`` works as a newline, and ``/me`` syntax can be formatted via ' +
				'wrapping the username in ``[]`` (eg: ``[14:20:21] • #PartMan hugs Hydro`` would be formatted ' +
				'as ``[14:20:21] • #[PartMan] hugs Hydro``).',
			syntax: 'CMD [new quote]',
			async run({ message, arg, broadcastHTML, $T }) {
				const parsedQuote = parseQuote(arg);
				const addedBy = message.author.name;
				const at = Temporal.Now.plainDateISO('UTC').toLocaleString('en-GB');

				const rendered = jsxToHTML(<FormatQuote quote={parsedQuote} addedBy={addedBy} dateAdded={at} />);

				if (rendered.length > MAX_QUOTE_LENGTH) throw new ChatError('Quote is too long.' as ToTranslate);
				await addQuote(parsedQuote, message.target.id, addedBy);
				const { length } = await getAllQuotes(message.target.id);
				broadcastHTML(
					<>
						<hr />
						<FormatQuote quote={parsedQuote} header={`Quote #${length} added.`} addedBy={addedBy} dateAdded={at} />
						<hr />
					</>,
					{ name: `viewquote-${message.parent.status.userid}` }
				);
			},
		},
		preview: {
			name: 'preview',
			aliases: ['p'],
			perms: (message, check) => (message.type === 'pm' ? true : check('driver')),
			help: 'Previews the given quote. Syntax is the same as add.',
			syntax: 'CMD [new quote]',
			async run({ message, arg, broadcastHTML, $T }) {
				const parsedQuote = parseQuote(arg);
				const { length } = await getAllQuotes(message.target.id);
				broadcastHTML(
					<>
						<hr />
						<FormatQuote quote={parsedQuote} header={`#${length} [preview]`} />
						<hr />
					</>,
					{ name: `previewquote-${message.parent.status.userid}` }
				);
			},
		},
		find: {
			name: 'find',
			aliases: ['f', 'filter', 'search'],
			help: 'Displays all quotes with the specified search term.',
			syntax: 'CMD [search term]',
			async run({ message, arg, broadcast, broadcastHTML, room: givenRoom, $T }) {
				if (!arg) throw new ChatError('Please provide a search term.' as ToTranslate);
				const room: string = await getRoom(givenRoom, message, $T);
				const quotes = await getAllQuotes(room);

				const foundQuotes: IndexedQuoteModel[] = searchQuotes(
					quotes.map<IndexedQuoteModel>((quote, index) => [index + 1, quote]),
					arg
				);

				if (!foundQuotes.length) return broadcast($T('COMMANDS.QUOTES.NO_QUOTES_FOUND'));

				const showQuotes = foundQuotes.slice(0, PAGE_SIZE);
				broadcastHTML(
					MultiQuotes({
						list: showQuotes,
						title: 'Matching Quotes',
						pageNum: foundQuotes.length > PAGE_SIZE ? 1 : null,
						total: foundQuotes.length,
						command: null,
					}),
					{ name: `viewquote-${message.parent.status.userid}` }
				);
			},
		},
		last: {
			name: 'last',
			aliases: ['z'],
			help: 'Displays the latest quote added.',
			syntax: 'CMD',
			async run({ message, broadcast, broadcastHTML, room: givenRoom, $T }) {
				const room: string = await getRoom(givenRoom, message, $T);
				const quotes = await getAllQuotes(room);
				if (!quotes.length) return broadcast($T('COMMANDS.QUOTES.NO_QUOTES_FOUND'));
				const lastQuote = quotes[quotes.length - 1];
				const dateAdded = Temporal.Instant.fromEpochMilliseconds(lastQuote.at.getTime())
					.toZonedDateTimeISO('UTC')
					.toPlainDate()
					.toLocaleString('en-GB');

				broadcastHTML(
					<>
						<hr />
						<FormatQuote quote={lastQuote.quote} header={`#${quotes.length}`} addedBy={lastQuote.addedBy} dateAdded={dateAdded} />
						<hr />
					</>,
					{ name: `viewquote-${message.parent.status.userid}` }
				);
			},
		},
		list: {
			name: 'list',
			aliases: ['l'],
			flags: { routePMs: true, allowPMs: false },
			help: 'Displays a list of quotes. Specify a number to view a specific page.',
			syntax: 'CMD [page number]',
			async run({ message, arg, broadcast, broadcastHTML, room: givenRoom, $T }) {
				const room: string = await getRoom(givenRoom, message, $T);
				const quotes = await getAllQuotes(room);
				if (!quotes.length) return broadcast($T('COMMANDS.QUOTES.NO_QUOTES_FOUND'));

				const pageNum = arg ? parseInt(arg) || 1 : 1;
				const startIndex = (pageNum - 1) * PAGE_SIZE;
				const endIndex = startIndex + PAGE_SIZE;
				const pagedQuotes: IndexedQuoteModel[] = quotes
					.slice(startIndex, endIndex)
					.map((quote, index) => [startIndex + index + 1, quote]);

				if (!pagedQuotes.length) throw new ChatError('Invalid page number.' as ToTranslate);

				broadcastHTML(
					MultiQuotes({
						list: pagedQuotes,
						pageNum: quotes.length > PAGE_SIZE ? pageNum : null,
						total: quotes.length,
						command: getCommand('quote list', message),
					}),
					{ name: `viewquote-${message.parent.status.userid}` }
				);
			},
		},
		page: {
			name: 'page',
			aliases: ['g'],
			flags: { routePMs: true, allowPMs: false },
			help: 'Sends the user an HTML page of quotes.',
			syntax: 'CMD [page number?]',
			async run({ message, arg, broadcast, room: givenRoom, $T }) {
				const room: string = await getRoom(givenRoom, message, $T);
				const quotes = await getAllQuotes(room);
				if (!quotes.length) return broadcast($T('COMMANDS.QUOTES.NO_QUOTES_FOUND'));

				const pageNum = arg ? parseInt(arg) || 1 : 1;
				const startIndex = (pageNum - 1) * PAGE_SIZE;
				const endIndex = startIndex + PAGE_SIZE;
				const pageQuotes: IndexedQuoteModel[] = quotes
					.slice(startIndex, endIndex)
					.map((quote, index) => [startIndex + index + 1, quote]);

				if (!pageQuotes.length) throw new ChatError('Invalid page number.' as ToTranslate);

				message.author.pageHTML(
					MultiQuotes({
						list: pageQuotes,
						showAll: true,
						pageNum: quotes.length > PAGE_SIZE ? pageNum : null,
						total: quotes.length,
						command: getCommand('quote page', message),
					}),
					{ name: `quotes-${room}` }
				);
			},
		},
		number: {
			name: 'number',
			aliases: ['n', 'amount', 'amt'],
			help: 'Displays the number of quotes in the room.',
			syntax: 'CMD',
			async run({ message, room: givenRoom, $T }) {
				const room: string = await getRoom(givenRoom, message, $T);
				const quotes = await getAllQuotes(room);
				message.reply(
					`There ${quotes.length === 1 ? 'is' : 'are'} ${pluralize(quotes.length, {
						singular: 'quote',
						plural: 'quotes',
					})} in this room.` as ToTranslate
				);
			},
		},
		delete: {
			name: 'delete',
			aliases: ['d', 'x', 'remove'],
			flags: { allowPMs: false },
			perms: 'driver',
			help: 'Deletes the given quote. Accepts either an index or a lookup term (``z`` deletes the last).',
			syntax: 'CMD [index/term]',
			async run({ message, arg, broadcast, broadcastHTML, $T }) {
				if (!arg) throw new ChatError('Please provide an index or search term.' as ToTranslate);
				const room = message.target.id;
				const quotes = await getAllQuotes(room);
				if (!quotes.length) return broadcast($T('COMMANDS.QUOTES.NO_QUOTES_FOUND'));

				let indexToDelete: number;
				let toDelete: QuoteModel;

				if (toId(arg) === 'z') {
					indexToDelete = quotes.length - 1;
					toDelete = quotes[indexToDelete];
				} else if (!isNaN(parseInt(arg))) {
					indexToDelete = parseInt(arg) - 1;
					if (indexToDelete < 0 || indexToDelete >= quotes.length) {
						throw new ChatError('Invalid quote index.' as ToTranslate);
					}
					toDelete = quotes[indexToDelete];
				} else {
					// Search for quote
					const matching = searchQuotes(
						quotes.map<IndexedQuoteModel>((quote, index) => [index + 1, quote]),
						arg
					).map(([, quote]) => quote);
					if (matching.length === 0) throw new ChatError('No quote found matching that term.' as ToTranslate);
					if (matching.length > 1) throw new ChatError('Multiple quotes found matching that term.' as ToTranslate);
					toDelete = matching[0];
					indexToDelete = quotes.indexOf(toDelete);
				}
				const dateAdded = Temporal.Instant.fromEpochMilliseconds(quotes[indexToDelete].at.getTime())
					.toZonedDateTimeISO('UTC')
					.toPlainDate()
					.toLocaleString('en-GB');

				broadcastHTML(
					<>
						<hr />
						<FormatQuote
							quote={quotes[indexToDelete].quote}
							header={`Deleting #${indexToDelete + 1}:`}
							addedBy={quotes[indexToDelete].addedBy}
							dateAdded={dateAdded}
						/>
						<hr />
					</>
				);
				message.reply($T('CONFIRM'));
				await message.target
					.waitFor(msg => toId(msg.content) === 'confirm')
					.catch(() => {
						throw new ChatError($T('NOT_CONFIRMED'));
					});

				Logger.deepLog(toDelete, `deleted by ${message.author.name} in ${message.target.title}`);
				await deleteQuoteByIndex(indexToDelete, toDelete, room);
				message.reply('Quote deleted.' as ToTranslate);
			},
		},
		room: {
			name: 'room',
			aliases: ['m'],
			help: "Runs the command in the context of the given room. Can set the user's PM quote room preference if no subcommand is given.",
			syntax: 'CMD [room] | [subcommand]',
			async run({ message, arg, run }) {
				if (!arg) throw new ChatError('Please provide a room and command.' as ToTranslate);
				const parts = arg.split('|');
				if (message.type === 'pm' && parts.length === 1) {
					PSQuoteRoomPrefs[message.author.userid] = { room: toRoomID(arg), at: new Date() };
					return message.reply(`Quote room preference set to ${arg}.` as ToTranslate);
				}
				const [targetRoom, subcommand] = parts;
				if (parts.length !== 2 || !toId(subcommand)) throw new ChatError('Please specify a room and a command.' as ToTranslate);
				const roomId = toRoomID(targetRoom);

				return run(`quote ${subcommand}`, { room: roomId });
			},
		},
	},
	async run({ message, arg, run, room: givenRoom, broadcastHTML, $T }) {
		if (!arg) return run('quote random');

		const room: string = await getRoom(givenRoom, message, $T);

		// Check if it's a number (index lookup)
		const index = parseInt(arg);
		if (!isNaN(index)) {
			const quotes = await getAllQuotes(room);
			if (index < 1 || index > quotes.length) {
				throw new ChatError('Invalid quote index.' as ToTranslate);
			}
			const quote = quotes[index - 1];
			const dateAdded = Temporal.Instant.fromEpochMilliseconds(quote.at.getTime())
				.toZonedDateTimeISO('UTC')
				.toPlainDate()
				.toLocaleString('en-GB');

			return broadcastHTML(
				<>
					<hr />
					<FormatQuote quote={quote.quote} header={`#${index}`} addedBy={quote.addedBy} dateAdded={dateAdded} />
					<hr />
				</>,
				{ name: `viewquote-${message.parent.status.userid}` }
			);
		}

		// Otherwise treat as search term
		return run(`quote random ${arg}`, { room });
	},
};
