import { promises as fs } from 'fs';
import path from 'path';

import { PSAliases, PSCommands } from '@/cache';
import { resetCache } from '@/cache/reset';
import getSecretCommands from '@/secrets/ps';
import { cachebust } from '@/utils/cachebust';
import { fsPath } from '@/utils/fsPath';

import type { PSCommand, PSCommandChild } from '@/types/chat';

// Generate aliases
function addAlias(command: PSCommandChild, stack: string[], aliasAs: readonly string[]) {
	if (command.children)
		Object.entries(command.children).forEach(([defaultName, subCommand]) => {
			const names = [defaultName, ...(subCommand.aliases || [])];
			names.forEach(name => addAlias(subCommand, [...stack, name], [...aliasAs, defaultName]));
		});
	PSAliases[stack.join(' ')] = [...aliasAs.slice(0, -1), command.name].join(' ');
}

export async function loadCommands(): Promise<void> {
	// Load command data
	const commandsList = [
		...(await fs.readdir(fsPath('ps', 'commands'), { recursive: true, withFileTypes: true }))
			.filter(entry => entry.isFile())
			.map(entry => path.join(entry.parentPath, entry.name)),
		...getSecretCommands().map(command => fsPath('secrets', 'src', 'ps', 'commands', command)),
	];
	await Promise.all(
		commandsList.map(async requirePath => {
			const { command: originalCommand }: { command: PSCommand | PSCommand[] } = await import(requirePath);
			if (!originalCommand) return;

			const commands = Array.isArray(originalCommand) ? originalCommand : [originalCommand];
			commands.forEach(command => {
				PSCommands[command.name] = { ...command, path: requirePath };
			});
			commands.forEach(command =>
				[command.name, ...(command.aliases || [])].forEach(name => addAlias(command, [name], [command.name]))
			);
		})
	);
	// And now for extended aliases
	// These are processed after all base commands so that we can
	// safely refer to commands from other files as well
	await Promise.all(
		commandsList.map(async requirePath => {
			const { command: originalCommand }: { command: PSCommand | PSCommand[] } = await import(requirePath);
			if (!originalCommand) return;

			const commands = Array.isArray(originalCommand) ? originalCommand : [originalCommand];
			commands.forEach(command => {
				if (command.extendedAliases) {
					Object.entries(command.extendedAliases).forEach(([lookup, aliasedTo]) => {
						const baseSubcommand = aliasedTo
							.slice(1)
							.reduce<
								PSCommandChild | undefined
							>((commandObj, subcommand) => commandObj?.children?.[subcommand], PSCommands[aliasedTo[0]]);
						if (!baseSubcommand) throw new Error(`Unable to find command ${lookup} aliased to ${aliasedTo}`);
						addAlias(baseSubcommand, [lookup], aliasedTo);
					});
				}
			});
		})
	);
}

export function unloadCommands(): void {
	// Delete cached commands
	Object.values(PSCommands).forEach(({ path }) => cachebust(path));
	// Delete command data and aliases
	resetCache('PSCommands', 'PSAliases');
}

export async function reloadCommands(): Promise<void> {
	unloadCommands();
	await loadCommands();
	return;
}
