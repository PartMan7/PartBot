import { promises as fs } from 'fs';

import { PSAliases, PSCommands } from '@/cache';
import { resetCache } from '@/cache/reset';
import getSecretCommands from '@/secrets/commands/ps';
import { cachebuster } from '@/utils/cachebuster';
import { fsPath } from '@/utils/fsPath';

import type { PSCommand } from '@/types/chat';

// Generate aliases
function addAlias(command: PSCommand, stack: string[], aliasAs: string[]) {
	if (command.children)
		Object.entries(command.children).forEach(([defaultName, subCommand]) => {
			const names = [defaultName, ...(subCommand.aliases || [])];
			names.forEach(name => addAlias(subCommand, [...stack, name], [...aliasAs, defaultName]));
		});
	PSAliases[stack.join(' ')] = [...aliasAs.slice(0, -1), command.name].join(' ');
}

export async function loadCommands(): Promise<void> {
	// Load command data
	const commands = [...(await fs.readdir(fsPath('ps', 'commands'))), ...getSecretCommands()];
	await Promise.all(
		commands.map(async commandFileName => {
			const requirePath = fsPath('ps', 'commands', commandFileName);

			const { command }: { command: PSCommand | PSCommand[] } = await import(requirePath);
			if (!command) return;

			const commands = Array.isArray(command) ? command : [command];
			commands.forEach(command => {
				PSCommands[command.name] = { ...command, path: requirePath };
			});
			commands.forEach(command =>
				[command.name, ...(command.aliases || [])].forEach(name => addAlias(command, [name], [command.name]))
			);
			// And now for extended aliases
			commands.forEach(command => {
				if (command.extendedAliases) {
					const newEntryAliases = Object.entries(command.extendedAliases).map(([key, value]) => [key, value.join(' ')]);
					Object.assign(PSAliases, newEntryAliases);
				}
			});
		})
	);
}

export function unloadCommands(): void {
	// Delete cached commands
	Object.values(PSCommands).forEach(({ path }) => cachebuster(path));
	// Delete command data and aliases
	resetCache('PSCommands', 'PSAliases');
}

export async function reloadCommands(): Promise<void> {
	unloadCommands();
	await loadCommands();
	return;
}
