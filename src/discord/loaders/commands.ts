import { REST, Routes, SlashCommandBuilder } from 'discord.js';

import { token, clientId } from '@/config/discord';

import { DiscCommands } from '@/cache';
import { resetCache } from '@/cache/reset';
import { cacheBuster } from '@/utils/cachebuster';

const restClient = new REST().setToken(token);

async function registerCommands() {
	log(DiscCommands);
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
	log('Registering Discord commands', { globalBody, guildSpecificBody });
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
			const { command }: { command: DiscCommand } = await import(requirePath);
			[command.name, ...(command.aliases ?? [])].forEach((commandName, isAlias) => {
				DiscCommands[commandName] = {
					...command,
					name: commandName,
					path: commandFile,
					isAlias: !!isAlias,
					slash: new SlashCommandBuilder().setName(commandName).setDescription(command.desc),
				};
			});
		})
	);
	await registerCommands();
}

export function unloadCommands(): void {
	// Delete require cache for commands
	Object.values(DiscCommands).forEach(({ path }) => cacheBuster(path));
	resetCache('DiscCommands');
}

export async function reloadCommands(): Promise<void> {
	unloadCommands();
	await loadCommands();
	return;
}
