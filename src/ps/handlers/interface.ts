import { PSGames } from '@/cache';
import { prefix } from '@/config/ps';
import { toId } from '@/tools';

import type { PSMessage } from '@/types/ps';

export function interfaceHandler(message: PSMessage) {
	// Ignore & messages
	if (message.isIntro || !message.author?.userid || !message.target) return;
	if (message.author.userid === message.parent.status.userid) return;
	if (message.type === 'pm') {
		// Handle page requests
		if (message.content.startsWith('|requestpage|')) return; // currently nothing; might do stuff with this later
		if (message.content.startsWith('|closepage|')) {
			const match = message.content.match(/^\|closepage\|(?<user>.*?)\|(?<pageId>\w+)$/);
			if (!match) return message.reply('...hmm hmm hmmmmmmmm very sus');
			if (toId(match.groups!.user) !== message.author.id) return message.reply('Wow I see how it is');
			const pageId = match.groups!.pageId;
			const gameId = `#${pageId.toUpperCase()}`;
			const singlePlayerGameId = `#${pageId.slice(0, 2)}-${pageId.slice(2)}`;

			// Check if there's any relevant games
			const game = Object.values(PSGames)
				.flatMap(gamesList => Object.values(gamesList))
				.find(checkGame => checkGame.id === gameId || checkGame.id === singlePlayerGameId);
			if (!game) return; // Don't put any errors here! People should be able to close games that don't exist, like ones that ended

			const user = message.author.id;
			const player = Object.values(game.players).find(p => p.id === user);
			if (game.hasPlayer(user) && player && !player.out) {
				message.reply(game.$T('GAME.CANNOT_LEAVE', { prefix, game: game.meta.id }));
				return game.update(user);
			}
			if (game.spectators.includes(user)) {
				game.spectators.remove(user);
				message.reply(
					game.$T('GAME.NO_LONGER_WATCHING', {
						game: game.meta.name,
						players: Object.values(game.players)
							.map(player => player.name)
							.list(game.$T),
					})
				);
			}

			return;
		}

		/* Challenges and battle-related handlers */

		/* Invites and related handlers */
	}
}
