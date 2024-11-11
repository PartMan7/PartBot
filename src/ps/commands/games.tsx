import { User } from 'ps-client';
import { Games } from '@/ps/games';
import { PSGames } from '@/cache';

import { usePersistedCache } from '@/cache/persisted';
import { ChatError } from '@/utils/chatError';
import { GAME } from '@/text';

const idCache = usePersistedCache('gameId');

// IDs are meant to be 4-character alphanumeric codes preceded with a '#'.
// I'm assuming we won't need more than 36^4 IDs...
function generateId(): string {
	const lastId = idCache.get();
	const newId = lastId + 1;
	idCache.set(newId);

	const idNum = (newId * 999979) % 36 ** 4;
	return `#${idNum.toString(36).padStart(4, '0').toUpperCase()}`;
}

type SearchContext =
	| { action: 'start'; user: string }
	| { action: 'join'; user: string }
	| { action: 'play'; user: string }
	| { action: 'end'; user: string }
	| { action: 'leave'; user: string }
	| { action: 'sub'; user1: string; user2: string };

export const command = Object.entries(Games).map(([_gameId, Game]): PSCommand => {
	const gameId = _gameId as keyof Games;

	type GameFilter = (game: InstanceType<typeof Game.instance>) => boolean;

	function getByContext(ctx: SearchContext): GameFilter {
		return game => {
			if (ctx.action === 'sub') {
				const hasUser1 = Object.values(game.players).some(player => player.id === ctx.user1);
				const hasUser2 = Object.values(game.players).some(player => player.id === ctx.user2);
				return (hasUser1 && !hasUser2) || (hasUser2 && !hasUser1);
			}
			const hasJoined = Object.values(game.players).some(player => player.id === ctx.user);
			const hasSpace =
				(game.turns && Object.keys(game.players).length < game.turns.length) || Object.keys(game.players).length < game.meta.maxSize!;
			switch (ctx.action) {
				case 'start':
					return game.startable ?? false;
				case 'join':
					return !game.started && !hasJoined && hasSpace;
				case 'play':
					return game.started && hasJoined && game.players[game.turn!].id === ctx.user;
				case 'end':
					return true;
				case 'leave':
					return hasJoined;
				default:
					return true;
			}
		};
	}

	function gameFromContext(specifier: string | null, searchCtx: SearchContext): InstanceType<typeof Game.instance> | null {
		if (!PSGames[gameId]) return null;
		if (typeof specifier === 'string' && /^#\w{4}$/.test(specifier)) return PSGames[gameId][specifier.toUpperCase()] ?? null;
		const allGames = Object.values(PSGames[gameId]);
		const byContext = getByContext(searchCtx);
		if (!specifier) {
			const validGames = allGames.filter(byContext);
			if (validGames.length === 1) return validGames[0];
			return null;
		}
		if (specifier?.includes(' vs ')) {
			const players = specifier.split(' vs ').map(Tools.toId);
			const lookup = players.sort().join('|');
			const matchingGames = allGames.filter(
				game =>
					Object.values(game.players)
						.map(player => player.id)
						.sort()
						.join('|') === lookup
			);
			if (matchingGames.length === 1) return matchingGames[0];
			const validGames = matchingGames.filter(byContext);
			if (validGames.length === 1) return validGames[0];
			return null;
		}
		return null;
	}

	function getGame(feed: string, searchCtx: SearchContext): { game: InstanceType<typeof Game.instance>; ctx: string } {
		const [fullSpec, fullCtx] = feed.lazySplit(/\s*,\s*/, 1);
		const fullGame = gameFromContext(fullSpec, searchCtx);
		if (fullGame) return { game: fullGame, ctx: fullCtx };
		const inferredGame = gameFromContext(null, searchCtx);
		if (inferredGame) return { game: inferredGame, ctx: feed };
		throw new ChatError(GAME.NOT_FOUND);
	}

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
					const { game, ctx } = getGame(arg, { action: 'join', user: message.author.id });
					const res = game.addPlayer(message.author, ctx);
					if (!res.success) throw new ChatError(res.error);
					const turnMsg = Game.meta.turns ? ` as ${Game.meta.turns[res.data!.as]}` : '';
					message.reply(`[[ ]]${message.author.name} joined the game of ${Game.meta.name}${turnMsg}! [${game.id}]`);
					if (res.data!.started) game.closeSignups();
					else game.signups();
				},
			},
			play: {
				name: 'play',
				aliases: ['p'],
				help: 'Performs an action.',
				syntax: 'CMD [id], [move]',
				async run({ message, arg }) {
					const { game, ctx } = getGame(arg, { action: 'play', user: message.author.id });
					game.action(message.author, ctx);
				},
			},
		},
	};
});
