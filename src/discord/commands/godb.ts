import { updatePokemonGOCache } from '@/cache/pokemonGo';
import { BOT_CHANNEL_ID, SERVER_ID } from '@/discord/constants/servers/pokemongo';

import type { DiscCommand } from '@/types/chat';

export const command: DiscCommand = {
	name: 'godb',
	desc: 'Updates the Pokémon GO database on PartBot.',
	servers: [SERVER_ID],
	async run(interaction) {
		if (interaction.channelId !== BOT_CHANNEL_ID) return interaction.reply('_softly flexes_ (not this channel)');
		await updatePokemonGOCache();
		interaction.reply('Done!');
	},
};
