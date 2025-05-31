import { prefix } from '@/config/ps';
import { LivePS } from '@/sentinel/live';
import { Perms } from '@/types/perms';
import { ChatError } from '@/utils/chatError';
import { Button, Username } from '@/utils/components/ps';
import { jsxToHTML } from '@/utils/jsxToHTML';

import type { ToTranslate } from '@/i18n/types';
import type { parse } from '@/ps/handlers/commands/parse';
import type { PSCommand } from '@/types/chat';
import type { ReactElement } from 'react';

function Syntax({ syntax, originalCommand }: { syntax: string | null; originalCommand: string }): ReactElement | null {
	if (!syntax) return null;
	return (
		<p>
			Syntax:{' '}
			<code>
				{prefix}
				{syntax.replace(/^CMD/, originalCommand)}
			</code>
		</p>
	);
}

function PermSummary({ perms }: { perms: Perms | undefined }): ReactElement | string | null {
	if (!perms) return null;
	if (typeof perms === 'function') {
		return 'custom';
	}
	if (Array.isArray(perms)) {
		return perms.join(' ');
	}
	if (typeof perms === 'symbol') {
		return <code>{Symbol.keyFor(perms)}</code>;
	}
	return perms;
}

function Perms({ perms }: { perms: Perms | undefined }): ReactElement | null {
	if (!perms) return null;
	return (
		<p>
			Requires <PermSummary perms={perms} /> permissions.
		</p>
	);
}

function Aliases({ parsed }: { parsed: ReturnType<typeof parse> }): ReactElement | null {
	const { sourceCommand, context } = parsed;
	const { command } = context;

	const aliases: string[] = [];

	if (sourceCommand.extendedAliases) {
		// TODO: This can actually have sub-levels of matching in extendedAliases
		// Why did I make this so complex...
		const target = command.join(' ');
		aliases.push(
			...Object.keys(sourceCommand.extendedAliases).filter(
				extendedAlias => sourceCommand.extendedAliases![extendedAlias].join(' ') === target
			)
		);
	}

	const directAliases: string[][] = [[command[0], ...(sourceCommand.aliases ?? [])]];
	let reducer: Exclude<PSCommand['children'], undefined>[string] = sourceCommand;
	command.slice(1).forEach(subCommand => {
		reducer = reducer.children![subCommand];
		directAliases.push([subCommand, ...(reducer.aliases ?? [])]);
	});

	if (directAliases.some(term => term.length > 1))
		aliases.push(directAliases.map(term => (term.length > 1 ? `(${term.join('/')})` : term[0])).join(' '));

	if (aliases.length === 0) return null;
	if (aliases.length === 1)
		return (
			<p>
				Aliases:{' '}
				<code>
					{prefix}
					{aliases[0]}
				</code>
			</p>
		);
	return (
		<>
			<hr />
			<details>
				<summary>Aliases</summary>
				{aliases
					.map(alias => (
						<code>
							{prefix}
							{alias}
						</code>
					))
					.space(<br />)}
			</details>
		</>
	);
}

function SubCommands({
	parsed,
	checkPermissions,
}: {
	parsed: ReturnType<typeof parse>;
	checkPermissions: (perms: Perms) => boolean;
}): ReactElement | null {
	const { command, context } = parsed;
	if (!command.children) return null;

	const validChildren = Object.values(command.children)
		.filter(child => !child.perms || checkPermissions(child.perms))
		.filter(child => !child.flags?.conceal);
	if (validChildren.length === 0) return null;

	return (
		<>
			<hr />
			<details>
				<summary>Subcommands</summary>
				{validChildren.map(child => (
					<p>
						<b>{child.name}</b>
						{child.help ? `: ${child.help}` : null}
						{child.perms ? (
							<>
								{' '}
								(<PermSummary perms={child.perms} />)
							</>
						) : null}
					</p>
				))}
			</details>
		</>
	);
}

export const command: PSCommand[] = [
	{
		name: 'help',
		help: 'Shows the help for a command.',
		syntax: 'CMD [command]',
		category: ['utility'],
		async run({ message, broadcastHTML, args, checkPermissions, $T }) {
			const Bot = message.parent;
			if (!args.length) {
				return broadcastHTML(
					<center className="infobox">
						<div style={{ maxWidth: 400 }}>
							<p>
								Hi! I'm <Username name={Bot.status.username ?? 'PartBot'} />, and I'll try to help you as best as I can.
							</p>
							<p>
								To start off, would you like to take a look at some{' '}
								<Button name="send" value={`/msg ${Bot.status.userid},${prefix}commands`}>
									commands
								</Button>{' '}
								you can use? {/* TODO: Move this to PartBot! */}
								Alternatively, you can take a look at my <a href="https://github.com/PartMan7/PartBotter">source code</a>.
							</p>
						</div>
					</center>
				);
			}
			// Parse the command to try and find what we need
			let parsed: ReturnType<typeof parse>;
			try {
				parsed = LivePS.commands.parse(args, [], $T);
				if (parsed.command.flags?.noDisplay) throw new Error(); // Don't show this here!
			} catch (e) {
				throw new ChatError('COULD_NOT_FIND_COMMAND' as ToTranslate); // TODO
			}
			const { command, context } = parsed;
			const closeEnough = context.args.length > 0 ? context.args.join('>') : null;
			if (command.perms && !checkPermissions(command.perms))
				throw new ChatError((command.flags?.conceal ? 'COULD_NOT_FIND_COMMAND' : 'ACCESS_DENIED') as ToTranslate);
			if (command.help) {
				broadcastHTML(
					<div className="infobox" style={{ padding: 8 }}>
						{closeEnough ? (
							<>
								<small>Couldn't find a subcommand with {closeEnough}, but here's its parent:</small>
								<br />
							</>
						) : null}
						<p>{command.help}</p>
						<Syntax syntax={command.syntax} originalCommand={context.originalCommand.join(' ')} />
						<Perms perms={command.perms} />
						{command.flags ? (
							<p>
								{Object.entries(command.flags).map(([flag, value]) => {
									if (!value) return null;
									if (flag === 'pmOnly') return 'Can only be used in PMs.';
									if (flag === 'roomOnly') return 'Can only be used in a chatroom.';
								})}
							</p>
						) : null}
						<Aliases parsed={parsed} />
						<SubCommands parsed={parsed} checkPermissions={checkPermissions} />
					</div>
				);
			}
		},
	},
];
