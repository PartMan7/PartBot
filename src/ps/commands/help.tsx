import { prefix } from '@/config/ps';
import { LivePSStuff } from '@/sentinel/live';
import { Perms } from '@/types/perms';
import { ChatError } from '@/utils/chatError';
import { Button, Username } from '@/utils/components/ps';
import { groupSub } from '@/utils/groupSub';

import type { parse } from '@/ps/handlers/commands/parse';
import type { PSCommand, PSCommandChild } from '@/types/chat';
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
	let reducer: PSCommandChild = sourceCommand;
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
	const { command } = parsed;
	if (!command.children) return null;

	const validChildren = Object.values(command.children)
		.filter(child => !child.perms || checkPermissions(child.perms))
		.filter(child => !child.flags?.noDisplay);
	if (validChildren.length === 0) return null;

	return (
		<>
			<hr />
			<details>
				<summary>Subcommands</summary>
				{validChildren.map(child => (
					<p style={{ paddingLeft: 12 }}>
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

export const command: PSCommand = {
	name: 'help',
	help: 'Shows the help for a command.',
	syntax: 'CMD [command]',
	flags: { allowPMs: true },
	categories: ['utility'],
	async run({ message, broadcastHTML, args, checkPermissions, $T }) {
		const Bot = message.parent;
		if (!args.length) {
			return broadcastHTML(
				<center className="infobox">
					<div style={{ maxWidth: 400 }}>
						<p>
							{groupSub($T('COMMANDS.HELP.MESSAGE_1'), {
								'<USERNAME />': <Username name={Bot.status.username ?? 'PartBot'} clickable />,
							})}
						</p>
						<p>
							{groupSub($T('COMMANDS.HELP.MESSAGE_2'), {
								'<COMMANDS />': (
									<Button name="send" value={`/msg ${Bot.status.userid},${prefix}commands`}>
										{$T('COMMANDS.HELP.COMMANDS')}
									</Button>
								),
								'<SOURCE_CODE />': <a href="https://github.com/PartMan7/PartBot">{$T('COMMANDS.HELP.SOURCE_CODE')}</a>,
							})}
						</p>
					</div>
				</center>
			);
		}
		// Parse the command to try and find what we need
		let parsed: ReturnType<typeof parse>;
		try {
			parsed = LivePSStuff.commands.parse(args, [], $T);
			if (parsed.command.flags?.noDisplay) throw new Error(); // Don't show this here!
		} catch (e) {
			throw new ChatError($T('COMMANDS.HELP.COULD_NOT_FIND_COMMAND'));
		}
		const { command, context } = parsed;
		const closeEnough = context.args.length > 0 ? context.args.join('>') : null;
		if (command.perms && !checkPermissions(command.perms))
			throw new ChatError($T(command.flags?.conceal ? 'COMMANDS.HELP.COULD_NOT_FIND_COMMAND' : 'ACCESS_DENIED'));
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
								if (flag === 'pmOnly') return $T('COMMANDS.HELP.PM_ONLY');
								if (flag === 'allowPMs') return $T('COMMANDS.HELP.ALLOW_PMS');
							})}
						</p>
					) : null}
					<Aliases parsed={parsed} />
					<SubCommands parsed={parsed} checkPermissions={checkPermissions} />
				</div>
			);
		}
	},
};
