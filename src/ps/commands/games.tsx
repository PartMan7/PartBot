import { Games } from '@/ps/games';
import { GamesList } from '@/ps/games/common';
import { Game } from '@/ps/games/game';
import { PSGames } from '@/cache';

import { usePersistedCache } from '@/cache/persisted';
import { ChatError } from '@/utils/chatError';

const idCache = usePersistedCache('gameId');

// IDs are meant to be 4-character alphanumeric codes preceded with a '#'.
// I'm assuming we won't need more than 36^4 IDs...
function generateId(): string {
	const lastId = idCache.get();
	const newId = lastId + 1;
	idCache.set(newId);

	const idNum = (newId * 999979) % 36 ** 4;
	return `#${idNum.toString(36).padStart(4, '0')}`;
}

export const command = Object.entries(Games).map(([_gameId, Game]): PSCommand => {
	const gameId = _gameId as keyof Games;
	return {
		name: gameId,
		aliases: Game.meta?.aliases,
		flags: {
			routePMs: true,
		},
		help: 'Game module.',
		syntax: 'CMD',
		async run({ run, command }) {
			return run(`help ${command.join(' ')}`);
		},
		children: {
			create: {
				name: 'create',
				aliases: ['new', 'n'],
				help: 'Creates a new game.',
				syntax: 'CMD [mods?]',
				perms: Symbol.for('games.create'),
				async run({ message }) {
					const id = generateId();
					const game = new Game.instance({ id, meta: Game.meta, room: message.target });
					message.reply(`/notifyrank all, ${Game.meta.name}, A game of ${Game.meta.name} has been created!,${gameId}signup`);
					game.signups();
				},
			},
			join: {
				name: 'join',
				aliases: ['j'],
				help: 'Joins a game.',
				syntax: 'CMD [id], [side]',
				async run({ message, arg }) {
					const [id, ...ctx] = arg.split(/\s*,\s*/);
					if (!id.startsWith('#')) throw new ChatError('Invalid game ID.');
					const game = PSGames[gameId]?.[id];
					if (!game) throw new ChatError('Game not found.');
					const res = game.addPlayer(message.author, ctx);
					if (!res.success) throw new ChatError(res.error);
				},
			},
			play: {
				name: 'play',
				aliases: ['p'],
				help: 'Performs an action.',
				syntax: 'CMD [id], [move]',
				async run({ message, arg }) {
					const [id, ...ctx] = arg.split(/\s*,\s*/);
					if (!id.startsWith('#')) throw new ChatError('Invalid game ID.');
					const game = PSGames[gameId]?.[id];
					if (!game) throw new ChatError('Game not found.');
					game.action(message.author, ctx);
				},
			},
		},
	};
});
