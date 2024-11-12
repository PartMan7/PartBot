import { Games } from '@/ps/games';
import { PSGames } from '@/cache';
import { generateId } from '@/ps/games/utils';
import { renderMenu } from '@/ps/games/menus';

import type { Room } from 'ps-client';
import type { TranslationFn } from '@/i18n/types';
import type { HTMLopts } from 'ps-client/classes/common';

type SearchContext =
	| { action: 'start'; user: string }
	| { action: 'join'; user: string }
	| { action: 'play'; user: string }
	| { action: 'end'; user: string }
	| { action: 'leave'; user: string }
	| { action: 'sub'; user1: string; user2: string };

type RoomContext = { room: Room; $T: TranslationFn };

const gameCommands = Object.entries(Games).map(([_gameId, Game]): PSCommand => {
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

	function gameFromContext(
		specifier: string | null,
		searchCtx: SearchContext,
		roomCtx: RoomContext
	): InstanceType<typeof Game.instance> | null {
		if (!PSGames[gameId]) return null;
		if (typeof specifier === 'string' && /^#\w{4}$/.test(specifier)) {
			const game = PSGames[gameId][specifier.toUpperCase()];
			if (!game) throw new ChatError(roomCtx.$T('GAME.NOT_FOUND'));
			return game;
		}
		const allGames = Object.values(PSGames[gameId]).filter(game => game.roomid === roomCtx.room.id);
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

	function getGame(
		feed: string,
		searchCtx: SearchContext,
		roomCtx: RoomContext
	): { game: InstanceType<typeof Game.instance>; ctx: string } {
		const { $T } = roomCtx;
		const [fullSpec, fullCtx] = feed.lazySplit(/\s*,\s*/, 1);
		const fullGame = gameFromContext(fullSpec, searchCtx, roomCtx);
		if (fullGame) return { game: fullGame, ctx: fullCtx };
		const inferredGame = gameFromContext(null, searchCtx, roomCtx);
		if (inferredGame) return { game: inferredGame, ctx: feed };
		throw new ChatError($T('GAME.NOT_FOUND'));
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
				async run({ message, $T }) {
					const id = generateId();
					const game = new Game.instance({ id, meta: Game.meta, room: message.target, $T });
					message.reply(`/notifyrank all, ${Game.meta.name}, A game of ${Game.meta.name} has been created!,${gameId}signup`);
					game.signups();
				},
			},
			join: {
				name: 'join',
				aliases: ['j'],
				help: 'Joins a game.',
				syntax: 'CMD [id], [side]',
				async run({ message, arg, $T }) {
					const { game, ctx } = getGame(arg, { action: 'join', user: message.author.id }, { room: message.target, $T });
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
				async run({ message, arg, $T }) {
					const { game, ctx } = getGame(arg, { action: 'play', user: message.author.id }, { room: message.target, $T });
					game.action(message.author, ctx);
				},
			},
			menu: {
				name: 'menu',
				aliases: ['m', 'list'],
				help: 'Displays active games.',
				perms: Symbol.for('games.manage'),
				syntax: 'CMD',
				async run({ message, broadcastHTML }) {
					const regHTML = renderMenu(message.target, Game.meta, false);
					const staffHTML = renderMenu(message.target, Game.meta, true);
					const opts: HTMLopts = { name: `${gameId}-menu` };
					broadcastHTML(regHTML, opts);
					message.target.sendHTML(staffHTML, { ...opts, rank: '%' });
				},
			},
		},
	};
});

const metaCommands: PSCommand = {
	name: 'games',
	help: 'Metacommands for games.',
	syntax: 'CMD [menu]',
	perms: Symbol.for('games.manage'),
	async run({ broadcastHTML }) {
		broadcastHTML(<div>BOO!</div>);
	},
	children: {
		menu: {
			name: 'menu',
			aliases: ['list', 'm'],
			help: 'Displays a menu of all games currently active.',
			syntax: 'CMD',
			async run({ message }) {},
		},
	},
};

export const command = [
	...gameCommands,
	metaCommands,
	{
		name: 'othellosequence',
		help: 'Sequence of fastest game in Othello.',
		syntax: 'CMD',
		async run({ broadcastHTML }) {
			broadcastHTML([['e6', 'f4'], ['e3', 'f6'], ['g5', 'd6'], ['e7', 'f5'], ['c5']].map(turns => turns.join(', ')).join('<br />'));
		},
	},
];
