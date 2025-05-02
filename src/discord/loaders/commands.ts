import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { promises as fs } from 'fs';

import { DiscCommands } from '@/cache';
import { resetCache } from '@/cache/reset';
import { clientId, token } from '@/config/discord';
import { cachebuster } from '@/utils/cachebuster';
import { fsPath } from '@/utils/fsPath';
import { log } from '@/utils/logger';

import type { DiscCommand } from '@/types/chat';

const restClient = new REST().setToken(token);

async function registerCommands() {
	const globalBody = Object.values(DiscCommands)
		.filter(command => !command.servers)
		.map(command => command.slash.toJSON());
	const guildSpecificBody = Object.values(DiscCommands).reduce<Record<string, ReturnType<SlashCommandBuilder['toJSON']>[]>>(
		(acc, command) => {
			if (!command.servers) return acc;
			command.servers.forEach(serverId => (acc[serverId] ??= []).push(command.slash.toJSON()));
			return acc;
		},
		{}
	);
	log('Registering Discord commands');
	await Promise.all([
		restClient.put(Routes.applicationCommands(clientId), { body: globalBody }),
		...Object.entries(guildSpecificBody).map(([guildId, commands]) =>
			restClient
				.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
				.catch(() => log(`Unable to register commands for guild #${guildId}`))
		),
	]);
}

export async function loadCommands(): Promise<void> {
	const commands = await fs.readdir(fsPath('discord', 'commands'));
	// Load commands into cache
	await Promise.all(
		commands.map(async commandFile => {
			const requirePath = fsPath('discord', 'commands', commandFile);
			const { command: commandEntries }: { command: DiscCommand | DiscCommand[] } = await import(requirePath);
			if (!commandEntries) return;
			const commands = Array.isArray(commandEntries) ? commandEntries : [commandEntries];
			commands.forEach(command =>
				[command.name, ...(command.aliases ?? [])].forEach((commandName, isAlias) => {
					const slash = new SlashCommandBuilder().setName(commandName).setDescription(command.desc);
					if (command.flags?.serverOnly) slash.setDMPermission(false); // TODO: This is deprecated?
					if (command.args) command.args(slash);

					DiscCommands[commandName] = {
						...command,
						name: commandName,
						path: commandFile,
						isAlias: !!isAlias,
						slash,
					};
				})
			);
		})
	);
	await registerCommands();
}

export function unloadCommands(): void {
	// Delete require cache for commands
	Object.values(DiscCommands).forEach(({ path }) => cachebuster(path));
	resetCache('DiscCommands');
}

export async function reloadCommands(): Promise<void> {
	unloadCommands();
	await loadCommands();
	return;
}
