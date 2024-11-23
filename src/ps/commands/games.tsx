import { Games } from '@/ps/games';
import { PSGames } from '@/cache';
import { generateId } from '@/ps/games/utils';
import { renderMenu } from '@/ps/games/menus';

import type { Room } from 'ps-client';
import type { TranslationFn } from '@/i18n/types';
import type { HTMLopts } from 'ps-client/classes/common';
import { ChatError } from '@/utils/chatError';
import { ReactElement } from 'react';

type SearchContext =
	| { action: 'start'; user: string }
	| { action: 'join'; user: string }
	| { action: 'play'; user: string }
	| { action: 'leave'; user?: string }
	| { action: 'end' }
	| { action: 'sub'; user1?: string; user2?: string }
	| { action: 'watch'; user: string }
	| { action: 'unwatch'; user: string };

type RoomContext = { room: Room; $T: TranslationFn };

const gameCommands = Object.entries(Games).map(([_gameId, Game]): PSCommand => {
	const gameId = _gameId as keyof Games;

	type GameFilter = (game: InstanceType<typeof Game.instance>) => boolean;

	function getByContext(ctx: SearchContext): GameFilter {
		return game => {
			if (ctx.action === 'sub') {
				const hasUser1 = Object.values(game.players).some(player => player.id === ctx.user1);
				const onlineUser1 = game.room.users.some(user => Tools.toId(user) === ctx.user1);
				const hasUser2 = Object.values(game.players).some(player => player.id === ctx.user2);
				const onlineUser2 = game.room.users.some(user => Tools.toId(user) === ctx.user2);
				return (hasUser1 && onlineUser1 && !hasUser2) || (hasUser2 && onlineUser2 && !hasUser1);
			}
			if (ctx.action === 'end') return true;
			const hasJoined = Object.values(game.players).some(player => player.id === ctx.user);
			const hasSpace =
				(game.sides && Object.keys(game.players).length < game.turns.length) || Object.keys(game.players).length < game.meta.maxSize!;
			switch (ctx.action) {
				case 'start':
					return game.startable ?? false;
				case 'join':
					return !game.started && !hasJoined && hasSpace;
				case 'play':
					return game.started && hasJoined && game.players[game.turn!].id === ctx.user;
				case 'leave':
					return hasJoined;
				case 'watch':
					return game.started && !hasJoined && !game.spectators.includes(ctx.user);
				case 'unwatch':
					return game.started && !hasJoined && game.spectators.includes(ctx.user);
				default:
					return true;
			}
		};
	}

	function gameFromContext(
		specifier: string | null,
		searchCtx: SearchContext,
		roomCtx: RoomContext,
		restCtx: string
	): InstanceType<typeof Game.instance> | null {
		if (!PSGames[gameId]) return null;
		if (typeof specifier === 'string' && /^#\w{4}$/.test(specifier)) {
			const game = PSGames[gameId][specifier.toUpperCase()];
			if (!game) throw new ChatError(roomCtx.$T('GAME.NOT_FOUND'));
			return game;
		}
		if (searchCtx.action === 'sub') {
			if (!restCtx) throw new ChatError(roomCtx.$T('GAME.INVALID_INPUT'));
			[searchCtx.user1, searchCtx.user2] = restCtx.split(',').map(Tools.toId);
			if (!searchCtx.user2) return null;
		}
		if (searchCtx.action === 'leave' && !searchCtx.user) {
			if (!restCtx) return null;
			searchCtx.user = Tools.toId(restCtx);
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
		const fullGame = gameFromContext(fullSpec, searchCtx, roomCtx, fullCtx);
		if (fullGame) return { game: fullGame, ctx: fullCtx };
		const inferredGame = gameFromContext(null, searchCtx, roomCtx, feed);
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
					message.reply(`${message.author.name} joined the game of ${Game.meta.name}${turnMsg}! [${game.id}]`); // TODO: $T
					if (res.data!.started) game.closeSignups();
					else game.signups();
				},
			},
			play: {
				name: 'play',
				aliases: ['p', '!'],
				help: 'Performs an action.',
				syntax: 'CMD [id], [move]',
				async run({ message, arg, $T }) {
					const { game, ctx } = getGame(arg, { action: 'play', user: message.author.id }, { room: message.target, $T });
					game.action(message.author, ctx);
				},
			},
			end: {
				name: 'end',
				aliases: ['e', 'x'],
				help: 'Ends a game.',
				perms: Symbol.for('games.manage'),
				syntax: 'CMD [game ref]',
				async run({ message, arg, $T }) {
					const { game } = getGame(arg, { action: 'end' }, { room: message.target, $T });
					game.end('force');
				},
			},
			substitute: {
				name: 'substitute',
				aliases: ['sub', 'swap'],
				help: 'Replaces an inactive player with an active one.',
				perms: Symbol.for('games.manage'),
				syntax: 'CMD #id, [user1], [user2]',
				async run({ message, arg, $T }) {
					const { game, ctx } = getGame(arg, { action: 'sub' }, { room: message.target, $T });
					const users = ctx.split(',').map(Tools.toId);
					const outUser = users.find(user => Object.values(game.players).some(player => player.id === user));
					const outTurn = (Object.keys(game.players) as (keyof typeof game.players)[]).find(turn => game.players[turn].id === outUser);
					const inUserId = users.find(user => !Object.values(game.players).some(player => player.id === user));
					const inUser = inUserId ? PS.getUser(inUserId) : false;
					if (!inUser || !outUser || !outTurn) throw new ChatError($T('GAME.IMPOSTOR_ALERT'));
					const replace = game.replacePlayer(outTurn, inUser);
					if (!replace.success) throw new ChatError(replace.error);
					if (replace.data) message.reply(replace.data);
					game.update();
				},
			},
			forfeit: {
				name: 'forfeit',
				aliases: ['f', 'ff', 'leave', 'l'],
				help: 'Forfeits a game, or leaves one in signups.',
				syntax: 'CMD #id',
				async run({ message, arg, $T }) {
					const { game } = getGame(arg, { action: 'leave', user: message.author.id }, { room: message.target, $T });
					if (game.started) {
						message.privateReply($T('CONFIRM'));
						await message.target
							.waitFor(msg => msg.content.toLowerCase() === 'confirm', 10_000)
							.catch(() => {
								throw new ChatError($T('CANCELLED'));
							});
					}
					const res = game.removePlayer(message.author);
					if (!res.success) throw new ChatError(res.error);
					if (res.data) {
						message.reply(res.data.message);
						if (res.data.cb) res.data.cb();
					}
					if (!game.started) game.signups();
				},
			},
			disqualify: {
				name: 'disqualify',
				aliases: ['dq', 'yeet'],
				help: 'Disqualifies a user.',
				perms: Symbol.for('games.manage'),
				syntax: 'CMD [game ref?], user',
				async run({ message, arg, $T }) {
					const { game, ctx } = getGame(arg, { action: 'leave' }, { room: message.target, $T });
					const res = game.removePlayer(Tools.toId(ctx));
					if (!res.success) throw new ChatError(res.error);
					if (res.data) {
						message.reply(res.data.message);
						if (res.data.cb) res.data.cb();
					}
					if (!game.started) game.signups();
				},
			},
			rejoin: {
				name: 'rejoin',
				aliases: ['rj'],
				help: 'Rejoins games that may have been left.',
				syntax: 'CMD',
				async run({ message, $T }) {
					const allGames = gameId in PSGames ? Object.values(PSGames[gameId]!) : [];
					const rejoinGames = allGames.filter(game => {
						// Filter with a side effect!
						// I'm sorry, superstar64
						if (
							Object.values(game.players).some(player => player.id === message.author.id) ||
							game.spectators.includes(message.author.id)
						) {
							game.update(message.author.id);
							return true;
						} else return false;
					});
					if (!rejoinGames.length) throw new ChatError($T('GAME.WATCHING_NOTHING'));
				},
			},
			watch: {
				name: 'watch',
				aliases: ['w', 'spectate', 'spec'],
				help: 'Watches the given game.',
				syntax: 'CMD [game ref]',
				async run({ message, arg, $T }) {
					const { game } = getGame(arg, { action: 'watch', user: message.author.id }, { room: message.target, $T });
					if (Object.values(game.players).some(player => player.id === message.author.id))
						throw new ChatError($T('GAME.ALREADY_JOINED'));
					if (game.spectators.includes(message.author.id)) throw new ChatError($T('GAME.ALREADY_WATCHING'));
					// TODO: watch context, eg: side
					game.spectators.push(message.author.id);
					message.privateReply(
						$T('GAME.NOW_WATCHING', {
							game: game.meta.name,
							players: Object.values(game.players)
								.map(player => player.name)
								.list($T),
						})
					);
					game.update(message.author.id);
				},
			},
			unwatch: {
				name: 'unwatch',
				aliases: ['uw', 'unspectate', 'uspec'],
				help: 'Unwatches the given game.',
				syntax: 'CMD [game ref]',
				async run({ message, arg, $T }) {
					// TODO: Hook closehtmlpage events to this
					const { game } = getGame(arg, { action: 'unwatch', user: message.author.id }, { room: message.target, $T });
					if (!game.spectators.includes(message.author.id)) throw new ChatError($T('GAME.NOT_WATCHING'));
					game.spectators.remove(message.author.id);
					message.privateReply(
						$T('GAME.NO_LONGER_WATCHING', {
							game: game.meta.name,
							players: Object.values(game.players)
								.map(player => player.name)
								.list($T),
						})
					);
					message.reply(`/closehtmlpage ${message.author.id}, ${game.id}`);
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
	async run({ run }) {
		return run('games menu');
	},
	children: {
		menu: {
			name: 'menu',
			aliases: ['list', 'm'],
			help: 'Displays a menu of all games currently active.',
			syntax: 'CMD',
			async run({ message, broadcastHTML }) {
				const Menu = ({ staff }: { staff?: boolean }): ReactElement => (
					<>
						<hr />
						{Object.values(Games)
							.map(Game => (
								<>
									<h3>{Game.meta.name}</h3>
									{renderMenu(message.target, Game.meta, !!staff)}
								</>
							))
							.space(<hr />)}
						<br />
						<hr />
					</>
				);
				const opts: HTMLopts = { name: 'games-menu' };
				broadcastHTML(<Menu />, opts);
				message.target.sendHTML(<Menu staff />, { ...opts, rank: '%' });
			},
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

/**
 * TODO:
 * Stash
 * Restore
 * Backups
 */
