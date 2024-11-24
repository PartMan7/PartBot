import { DiscCommands } from '@/cache';
import { admins } from '@/config/discord';
import { ACCESS_DENIED, PM_ONLY_COMMAND } from '@/text';
import { ChatError } from '@/utils/chatError';
import { log } from '@/utils/logger';

import type { Interaction } from 'discord.js';

export default async function messageHandler(interaction: Interaction): Promise<void> {
	if (!interaction.isChatInputCommand()) return;

	const command = DiscCommands[interaction.commandName];
	if (!command) return;

	if (command.perms === 'admin') {
		if (!admins.includes(interaction.user.id)) throw new ChatError(ACCESS_DENIED);
	}
	if (typeof command.perms === 'function') {
		if (!command.perms(interaction)) throw new ChatError(ACCESS_DENIED);
	}

	if (command.flags?.pmOnly) {
		if (interaction.guild) throw new ChatError(PM_ONLY_COMMAND);
	}

	try {
		await command.run(interaction);
	} catch (err) {
		if (err instanceof Error) {
			interaction.reply({ content: err.message, ephemeral: true });
			if (err.name !== 'ChatError') log(err);
		}
	}
}
