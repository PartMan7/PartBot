import type { PSCommand } from 'types/chat';

// import dynamicImport from 'utils/dynamic-import';
import emptyObject from 'utils/empty-object';
import { PSAliases, PSCommands } from 'cache';

export function loadCommands (): void {
	// Load command data
	const commands = fsSync.readdirSync(fsPath('ps', 'commands'));
	commands.map(commandFileName => {
		const [commandName, ...commandFlags] = commandFileName.split('.')[0].split('-');
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { default: command }: { default: PSCommand } = require(fsPath('ps', 'commands', `${commandName}`));
		// const command = await dynamicImport(`ps/commands/${commandName}`);
		PSCommands[commandName] = command;

		// Generate aliases
		const aliasEntries = Object.entries(command.children || {}).map(([key, value]) => {
			return key.split(',').map(k => [k, value]);
		}).flat();
		function addAlias (command: PSCommand, stack: string[]) {
			if (command.children) Object.entries(command.children).forEach(([defaultName, subCommand]) => {
				const names = [defaultName, ...(subCommand.aliases || [])];
				names.forEach(name => addAlias(subCommand, [...stack, name]));
			});
			PSAliases[stack.join(' ')] = [...stack.slice(0, -1), command.name].join(' ');
		}
		[commandName, ...(command.aliases || [])].forEach(name => addAlias(command, [name]));
		// And now for extended aliases
		Object.assign(PSAliases, command.extendedAliases || {});
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
