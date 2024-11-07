import { prefix } from '@/config/ps';
import { addQuote, getAllQuotes } from '@/database/quotes';
import { PSQuoteRoomPrefs } from '@/cache';

import { QUOTES } from '@/text';
import { Username as UsernameCustom } from '@/utils/components';
import { Username as UsernamePS } from '@/utils/components/ps';
import { escapeRegEx } from '@/utils/regexEscape';
import { MAX_CHAT_HTML_LENGTH, MAX_PAGE_HTML_LENGTH } from '@/ps/constants';

import type { ReactElement, ReactNode } from 'react';
import { jsxToHTML } from '@/utils/jsxToHTML';

type QuoteCollection = [index: number, quote: string][];

function Entry({ name, children }) {
	return (
		<li>
			<b>{name}</b>: {children}
		</li>
	);
}

const ranks = ['★', '☆', '^', '⛵', 'ᗢ', '+', '%', '§', '@', '*', '#', '&', '~', '$', '-'].join('');
const chatRegEx = new RegExp(`^(\\[(?:\\d{2}:){1,2}\\d{2}] )?([${ranks}]?)([a-zA-Z0-9][^:]{0,25}?): (.*)$`);
const meRegEx = new RegExp(`^(\\[(?:\\d{2}:){1,2}\\d{2}] )?• ([${ranks}]?)(\\[[a-zA-Z0-9][^\\]]{0,25}]) (.*)$`);
const rawMeRegEx = new RegExp(`^((?:\\[(?:\\d{2}:){1,2}\\d{2}] )?• [${ranks}]?)([a-zA-Z0-9]\\S{0,25})( .*)$`);
const jnlRegEx = /^(?:.*? (?:joined|left)(?:; )?){1,2}$/;
const rawRegEx = /^(\[(?:\d{2}:){1,2}\d{2}] )?(.*)$/;

async function getRoom(message: PSMessage): Promise<string> {
	if (message.type === 'chat') return message.target.roomid;
	const prefs = PSQuoteRoomPrefs[message.author.userid];
	if (prefs && message.time - prefs.at.getTime() < Tools.fromHumanTime('1 hour')) return prefs.room;
	message.reply(`Which room are you looking for a quote in?`);
	const answer = await message.target
		.waitFor(msg => {
			return msg.content.length > 0;
		})
		.catch(() => {
			throw new ChatError('Did not receive a room within a minute');
		});
	const _room = Tools.toId(answer.content);
	PSQuoteRoomPrefs[message.author.userid] = { room: _room, at: new Date() };
	return _room;
}

function parseQuote(quote: string): string {
	const lines = quote.trim().split(/ {3}|\\n|\n/);
	const foundNames = lines
		.map(line => line.match(chatRegEx)?.[3])
		.filter(Boolean)
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

function FormatQuoteLine({
	line,
	style,
	psUsernameTag,
}: {
	line: string;
	style?: React.CSSProperties;
	psUsernameTag?: boolean;
}): ReactNode {
	const chatMatch = line.match(chatRegEx);
	if (chatMatch)
		return (
			<div className="chat chatmessage-a" style={style ?? { padding: '3px 0' }}>
				<small>{chatMatch[1] + chatMatch[2]}</small>
				<span className="username">
					{psUsernameTag ? <UsernamePS name={`${chatMatch[3]}:`} /> : <UsernameCustom name={`${chatMatch[3]}:`} />}
				</span>
				<em> {chatMatch[4]}</em>
			</div>
		);

	const meMatch = line.match(meRegEx);
	if (meMatch)
		return (
			<div className={`chat chatmessage-${Tools.toId(meMatch[3])}`} style={style ?? { padding: '3px 0' }}>
				<small>{meMatch[1]}</small>
				<UsernameCustom name={meMatch[3]}>• </UsernameCustom>
				<em>
					<small>{meMatch[2]}</small>
					<span className="username">{meMatch[3].slice(1, -1)}</span>
					<i> {meMatch[4]}</i>
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
			<div className="chat chatmessage-partbot" style={style ?? { padding: '3px 0' }}>
				<small>{rawMatch[1]}</small>
				{rawMatch[2]}
			</div>
		);

	return undefined;
}

function FormatQuote({
	quote,
	psUsernameTag = true,
	header,
	children,
}: {
	quote: string;
	psUsernameTag?: boolean;
	header?: ReactNode;
	children?: ReactElement[];
}): ReactElement {
	const quoteLines = quote.split('\n');
	return (
		<>
			{header}
			{quoteLines.length > 5 ? (
				<details className="readmore">
					<summary>
						{quoteLines.slice(0, 2).map(line => (
							<FormatQuoteLine line={line} psUsernameTag={psUsernameTag} />
						))}
						<FormatQuoteLine
							line={quoteLines[2]}
							psUsernameTag={psUsernameTag}
							style={{
								padding: '3px 0',
								display: 'inline-block',
							}}
						/>
					</summary>
					{quoteLines.slice(3).map(line => (
						<FormatQuoteLine line={line} psUsernameTag={psUsernameTag} />
					))}
				</details>
			) : (
				quoteLines.map(line => <FormatQuoteLine line={line} psUsernameTag={psUsernameTag} />)
			)}
		</>
	);
}

function FormatSmogQuote(quote: string): string {
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

function MultiQuotes({ list, paginate, buffer }: { list: QuoteCollection; paginate?: boolean; buffer?: number }): {
	component: string;
	remaining: QuoteCollection;
} {
	const quoteList = list.slice();
	const cap = (paginate ? MAX_PAGE_HTML_LENGTH : MAX_CHAT_HTML_LENGTH) - buffer;

	const renderedQuotes: QuoteCollection = [];
	let component = '';

	while (quoteList.length) {
		const next = quoteList.shift();
		const newComponent = jsxToHTML(
			<>
				<hr />
				{[...renderedQuotes, next].map(([header, quote]) => (
					<>
						<FormatQuote quote={quote} header={`#${header}`} />
						<hr />
					</>
				))}
			</>
		);
		if (newComponent.length > cap) break;
		component = newComponent;
		renderedQuotes.push(next);
	}
	return { component, remaining: quoteList };
}

export const command: PSCommand = {
	name: 'quotes',
	aliases: ['q', 'quote'],
	help: null,
	syntax: 'CMD',
	children: {
		help: {
			name: 'help',
			aliases: ['h'],
			help: "Remove the extra 'help'...",
			syntax: 'CMD',
			async run({ broadcastHTML }) {
				broadcastHTML(
					<ul>
						<Entry name="(term / index)">Displays a random quote with the specified search term / at the given index.</Entry>
						<Entry name="help [h]">Displays this message.</Entry>
						<Entry name="random [r]">Displays a random quote.</Entry>
						<Entry name="find [f]">Displays all quotes with the specified search term.</Entry>
						<Entry name="last [z]">Displays the latest quote added.</Entry>
						<Entry name="list [l]">
							Displays a list (up to 50 quotes per list). If given a number, specifically looks up that list.
						</Entry>
						<Entry name="page [g]">Sends the user an HTML page (up to 50 quotes per page).</Entry>
						<Entry name="number [n]">Displays the number of quotes in the room.</Entry>
						<Entry name="preview [p]">Displays a preview of the given quote (without actually adding it)</Entry>
						<Entry name="add [a]">
							Adds the given quote. <code>\n</code> works as a newline, and <code>/me</code> syntax can be formatted via wrapping the
							username in <code>[]</code> (eg: <code>[14:20:21] • #PartMan hugs Hydro</code> would be formatted as{' '}
							<code>[14:20:21] • #[PartMan] hugs Hydro</code>) (staff-only)
						</Entry>
						<Entry name="delete [d/x]">
							Deletes the given quote. Accepts either an index or a lookup term (<code>z</code> deletes the last)
						</Entry>
						<Entry name="room [m]">
							Runs the command in the context of the given room. Eg: <code>{prefix}quote room Bot Development | list</code>
						</Entry>
					</ul>,
					{ name: 'quotehelp-partbot' }
				);
			},
		},
		random: {
			name: 'random',
			aliases: ['rand', 'r'],
			help: 'Displays a random quote',
			syntax: 'CMD',
			async run({ message, broadcast, broadcastHTML, room: _room }) {
				const room: string = (_room as string) ?? (await getRoom(message));
				const [index, randQuote] = Object.entries(await getAllQuotes(room)).random();
				if (!randQuote) return broadcast(QUOTES.NO_QUOTES_FOUND);
				broadcastHTML(
					<>
						<hr />
						<FormatQuote quote={randQuote.quote} header={`#${~~index + 1}`} />
						<hr />
					</>,
					{ name: 'viewquote-partbot' }
				);
			},
		},
		add: {
			name: 'add',
			aliases: ['new', 'a', 'n'],
			perms: 'driver',
			help:
				'Adds the given quote. <code>\n</code> works as a newline, and <code>/me</code> syntax can be formatted via ' +
				'wrapping the username in <code>[]</code> (eg: <code>[14:20:21] • #PartMan hugs Hydro</code> would be formatted ' +
				'as <code>[14:20:21] • #[PartMan] hugs Hydro</code>) (staff-only)',
			syntax: 'CMD [new quote]',
			flags: {
				roomOnly: true,
			},
			async run({ message, arg, broadcastHTML }) {
				const parsedQuote = parseQuote(arg);
				await addQuote(parsedQuote, message.target.id, message.author.name);
				const { length } = await getAllQuotes(message.target.id);
				broadcastHTML(
					<>
						<hr />
						<FormatQuote quote={parsedQuote} header={`#${length}`} />
						<hr />
					</>,
					{ name: 'viewquote-partbot' }
				);
			},
		},
		preview: {
			name: 'preview',
			aliases: ['p'],
			perms: 'driver',
			help: 'Previews the given quote. Syntax is the same as add (staff-only)',
			syntax: 'CMD [new quote]',
			flags: {
				roomOnly: true,
			},
			async run({ message, arg, broadcastHTML }) {
				const parsedQuote = parseQuote(arg);
				const { length } = await getAllQuotes(message.target.id);
				broadcastHTML(
					<>
						<hr />
						<FormatQuote quote={parsedQuote} header={`#${length} [preview]`} />
						<hr />
					</>,
					{ name: 'previewquote-partbot' }
				);
			},
		},
	},
	async run({ run }) {
		return run('quote random');
	},
};
