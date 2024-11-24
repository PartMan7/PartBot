import { DiscCommands } from '@/cache';
import { admins } from '@/config/discord';
import { i18n } from '@/i18n';
import { ChatError } from '@/utils/chatError';
import { log } from '@/utils/logger';

import type { Interaction } from 'discord.js';

export default async function messageHandler(interaction: Interaction): Promise<void> {
	const $T = i18n(); // TODO: Support i18n for servers, eventually?
	if (!interaction.isChatInputCommand()) return;

	const command = DiscCommands[interaction.commandName];
	if (!command) return;

	if (command.perms === 'admin') {
		if (!admins.includes(interaction.user.id)) throw new ChatError($T('ACCESS_DENIED'));
	}
	if (typeof command.perms === 'function') {
		if (!command.perms(interaction)) throw new ChatError($T('ACCESS_DENIED'));
	}

	if (command.flags?.pmOnly) {
		if (interaction.guild) throw new ChatError($T('PM_ONLY_COMMAND'));
	}

	try {
		await command.run(interaction, $T);
	} catch (err) {
		if (err instanceof Error) {
			interaction.reply({ content: err.message, ephemeral: true });
			if (err.name !== 'ChatError') log(err);
		}
	}
}
