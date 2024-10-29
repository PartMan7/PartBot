import { DiscCommands } from '@/cache';

import type { Interaction } from 'discord.js';

export default async function messageHandler(interaction: Interaction): Promise<void> {
	if (!interaction.isChatInputCommand()) return;

	const command = DiscCommands[interaction.commandName];
	if (!command) return;

	try {
		await command.run(interaction);
	} catch (err) {
		interaction.reply({ content: err.message, ephemeral: true });
		if (err.name !== 'ChatError') log(err);
	}
}
