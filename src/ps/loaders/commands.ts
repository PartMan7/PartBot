import type { PSCommand } from '@/types/chat';

import getSecretCommands from '@/secrets/commands/ps';

import { cacheBuster } from '@/utils/cachebuster';
import { PSAliases, PSCommands } from '@/cache';
import resetCache from '@/cache/reset';

// Generate aliases
function addAlias(command: PSCommand, stack: string[], aliasAs: string[]) {
	if (command.children)
		Object.entries(command.children).forEach(([defaultName, subCommand]) => {
			const names = [defaultName, ...(subCommand.aliases || [])];
			names.forEach(name => addAlias(subCommand, [...stack, name], [...aliasAs, defaultName]));
		});
	PSAliases[stack.join(' ')] = [...aliasAs.slice(0, -1), command.name].join(' ');
}

export function loadCommands(): Promise<void> {
	// Load command data
	return fs
		.readdir(fsPath('ps', 'commands'))
		.then(commands => [...commands, ...getSecretCommands()])
		.then(async commands => {
			await Promise.all(
				commands.map(async commandFileName => {
					const requirePath = fsPath('ps', 'commands', commandFileName);

					const { command }: { command: PSCommand | PSCommand[] } = await import(requirePath);

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
		});
}

export function unloadCommands(): void {
	// Delete cached commands
	Object.values(PSCommands).forEach(({ path }) => cacheBuster(path));
	// Delete command data and aliases
	resetCache(['PSCommands', 'PSAliases']);
}

export async function reloadCommands(): Promise<void> {
	unloadCommands();
	await loadCommands();
	return;
}
