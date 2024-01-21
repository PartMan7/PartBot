import type { PSCommand } from 'types/chat';

import emptyObject from 'utils/empty-object';
import { PSAliases, PSCommands } from 'cache';

// Generate aliases
function addAlias (command: PSCommand, stack: string[]) {
	if (command.children) Object.entries(command.children).forEach(([defaultName, subCommand]) => {
		const names = [defaultName, ...subCommand.aliases || []];
		names.forEach(name => addAlias(subCommand, [...stack, name]));
	});
	PSAliases[stack.join(' ')] = [...stack.slice(0, -1), command.name].join(' ');
}

export function loadCommands (): Promise<void[]> {
	// Load command data
	const commands = fsSync.readdirSync(fsPath('ps', 'commands'));
	return Promise.all(commands.map(async commandFileName => {
		if (commandFileName.endsWith('.map')) return; // Ignore mapFiles
		const requirePath = fsPath('ps', 'commands', commandFileName);

		const { command }: { command: PSCommand | PSCommand[] } = await import(requirePath);
		// const hotMod: { default: PSCommand } = await import(requirePath);
		// As to why this uses hotImport instead of the commented-out
		// import above, check https://github.com/nodejs/modules/issues/307

		const commands = Array.isArray(command) ? command : [command];
		commands.forEach(command => {
			PSCommands[command.name] = { ...command, path: requirePath };
		});
		commands.forEach(command => [command.name, ...command.aliases || []].forEach(name => addAlias(command, [name])));
		// And now for extended aliases
		commands.forEach(command => {
			if (command.extendedAliases) {
				const newEntryAliases = Object.entries(command.extendedAliases).map(([key, value]) => [key, value.join(' ')]);
				Object.assign(PSAliases, newEntryAliases);
			}
		});

		// And now we store the file string in memory
		// :pain:
		// PSCommandFiles[commandFileName] = fileString;
		// if (commands.some(command => command.name === 'quotes')) log(fsSync.readFileSync(requirePath, 'utf8'));
	}));
}

export function unloadCommands (): void {
	Object.values(PSCommands).map(val => val.path).forEach(path => {
		log(require.cache[path]);
		delete require.cache[path];
		log(require.cache[path]);
	});
	// Delete command data
	emptyObject(PSCommands);
	// Delete aliases
	emptyObject(PSAliases);
}

export function reloadCommands (): Promise<void[]> {
	unloadCommands();
	return loadCommands();
}
