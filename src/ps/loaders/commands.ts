import type { PSCommand } from 'types/chat';

import emptyObject from 'utils/empty-object';
import { PSAliases, PSCommands } from 'cache';

export function loadCommands (): void {
	const commandFlagMaps = {
		hidden: command => command,
		nodisplay: command => command // TODO
	};
	// Load command data
	const commands = fsSync.readdirSync(fsPath('ps', 'commands'));
	commands.map(commandFileName => {
		const [commandName, ...commandFlags] = commandFileName.split('.')[0].split('-');
		const requirePath = fsPath('ps', 'commands', `${[commandName, ...commandFlags].join('-')}`);
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { default: command }: { default: PSCommand | PSCommand[] } = require(requirePath);
		// Yes that might have been a bit hacky but it's way easier, sue me
		const commands = Array.isArray(command) ? command : [command];
		commandFlags.forEach(flag => commands.forEach(command => commandFlagMaps[flag]?.(command)));
		commands.forEach(command => PSCommands[command.name] = command);

		// Generate aliases
		function addAlias (command: PSCommand, stack: string[]) {
			if (command.children) Object.entries(command.children).forEach(([defaultName, subCommand]) => {
				const names = [defaultName, ...subCommand.aliases || []];
				names.forEach(name => addAlias(subCommand, [...stack, name]));
			});
			PSAliases[stack.join(' ')] = [...stack.slice(0, -1), command.name].join(' ');
		}
		commands.forEach(command => [command.name, ...command.aliases || []].forEach(name => addAlias(command, [name])));
		// And now for extended aliases
		commands.forEach(command => Object.assign(PSAliases, command.extendedAliases || {}));
	});
}

export function unloadCommands (): void {
	// Delete command data
	emptyObject(PSCommands);
	// Delete aliases
	emptyObject(PSAliases);
}

export function reloadCommands (): void {
	unloadCommands();
	loadCommands();
}
