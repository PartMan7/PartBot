import { PSGames } from '@/cache';
import { gameCache } from '@/cache/games';
import { Games } from '@/ps/games';
import { renderBackups, renderMenu } from '@/ps/games/menus';
import { parseMod } from '@/ps/games/mods';
import { generateId } from '@/ps/games/utils';
import { toId } from '@/tools';
import { ChatError } from '@/utils/chatError';

import type { NoTranslate, ToTranslate, TranslationFn } from '@/i18n/types';
import type { CommonGame } from '@/ps/games/game';
import type { PSCommand } from '@/types/chat';
import type { Room } from 'ps-client';
import type { HTMLopts } from 'ps-client/classes/common';

type SearchContext =
	| { action: 'start'; user: string }
	| { action: 'join'; user: string }
	| { action: 'reaction'; user: string }
	| { action: 'audience'; user: string }
	| { action: 'play'; user: string }
	| { action: 'leave'; user?: string }
	| { action: 'sub'; user1?: string; user2?: string }
	| { action: 'watch'; user: string }
	| { action: 'unwatch'; user: string }
	| { action: 'mod'; user: string }
	| { action: 'any' };

type RoomContext = { room: Room; $T: TranslationFn };

export const command: PSCommand[] = Object.entries(Games).map(([_gameId, Game]): PSCommand => {
	const gameId = _gameId as keyof Games;

	type GameFilter = (game: CommonGame) => boolean;

	function getByContext(ctx: SearchContext): GameFilter {
		return game => {
			if (ctx.action === 'sub') {
				const hasUser1 = !!ctx.user1 && game.hasPlayer(ctx.user1);
				const onlineUser1 = game.room.users.some(user => toId(user) === ctx.user1);
				const hasUser2 = !!ctx.user2 && game.hasPlayer(ctx.user2);
				const onlineUser2 = game.room.users.some(user => toId(user) === ctx.user2);
				return (hasUser1 && onlineUser2 && !hasUser2) || (hasUser2 && onlineUser1 && !hasUser1);
			}
			if (ctx.action === 'any') return true;
			const hasJoined = !!ctx.user && game.hasPlayer(ctx.user);
			const hasSpace =
				(game.sides && Object.keys(game.players).length < game.turns.length) || Object.keys(game.players).length < game.meta.maxSize!;
			switch (ctx.action) {
				case 'start':
					return game.startable() ?? false;
				case 'join':
					return !game.started && !hasJoined && hasSpace;
				case 'play':
					return game.started && hasJoined && game.players[game.turn!].id === ctx.user;
				case 'reaction':
					return game.started && hasJoined;
				case 'audience':
					return game.started && !hasJoined;
				case 'leave':
					return hasJoined;
				case 'watch':
					return game.started && !hasJoined && !game.spectators.includes(ctx.user);
				case 'unwatch':
					return game.started && !hasJoined && game.spectators.includes(ctx.user);
				case 'mod':
					return game.moddable?.() ?? false;
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
	): CommonGame | null {
		if (!PSGames[gameId]) return null;
		if (Game.meta.players === 'single') {
			const inferredSpecifier = typeof specifier === 'string' ? `#${Game.meta.abbr}-${toId(specifier)}` : specifier;
			if (typeof inferredSpecifier === 'string' && /^#/.test(inferredSpecifier)) {
				const game = PSGames[gameId][inferredSpecifier];
				if (game) return game;
			}
		}

		if (typeof specifier === 'string' && /^#/.test(specifier)) {
			const game = PSGames[gameId][specifier.toUpperCase()] ?? PSGames[gameId][specifier];
			if (!game) throw new ChatError(roomCtx.$T('GAME.NOT_FOUND'));
			return game;
		}
		if (searchCtx.action === 'sub') {
			if (!restCtx) throw new ChatError(roomCtx.$T('GAME.INVALID_INPUT'));
			[searchCtx.user1, searchCtx.user2] = restCtx.split(',').map(toId);
			if (!searchCtx.user2) return null;
		}
		if (searchCtx.action === 'leave' && !searchCtx.user) {
			if (!restCtx) return null;
			searchCtx.user = toId(restCtx);
		}
		const allGames = Object.values(PSGames[gameId]).filter(game => game.roomid === roomCtx.room.id);
		const byContext = getByContext(searchCtx);
		if (!specifier) {
			const validGames = allGames.filter(byContext);
			if (validGames.length === 1) return validGames[0];
			return null;
		}
		if (specifier?.includes(' vs ')) {
			const players = specifier.split(' vs ').map(toId);
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

	function getGame(feed: string, searchCtx: SearchContext, roomCtx: RoomContext): { game: CommonGame; ctx: string } {
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
		...(Game.meta.aliases ? { aliases: Game.meta?.aliases } : {}),
		flags: {
			routePMs: true,
		},
		help: 'Game module.',
		syntax: 'CMD',
		async run({ run, command }) {
			return run(`help ${command.join(' ')}`);
		},
		categories: ['game'],
		children: {
			create: {
				name: 'create',
				aliases: ['new', 'n'],
				help: 'Creates a new game.',
				syntax: 'CMD [mods?]',
				perms: Game.meta.players === 'single' ? 'regular' : Symbol.for('games.create'),
				async run({ message, args, $T }) {
					if (Game.meta.players === 'single') {
						if (Object.values(PSGames[gameId] ?? {}).find(game => message.author.id in game.players)) {
							throw new ChatError($T('GAME.ALREADY_JOINED'));
						}
					}
					const id = Game.meta.players === 'single' ? `#${Game.meta.abbr}-${message.author.id}` : generateId();
					if (PSGames[gameId]?.[id]) throw new ChatError($T('GAME.ALREADY_STARTED'));
					if (message.type === 'pm') throw new ChatError("Can't create a game in DMs!" as ToTranslate);
					const game = new Game.instance({ id, meta: Game.meta, room: message.target, $T, args, by: message.author });
					if (game.meta.players === 'many') {
						message.reply(
							`/notifyrank all, ${Game.meta.name}, A game of ${Game.meta.name} has been created!,${gameId}signup` as ToTranslate
						);
						game.signups();
					} else if (game.meta.players === 'single') {
						game.update();
					}
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
					message.reply(
						`${message.author.name} joined the game of ${Game.meta.name}${turnMsg}${
							ctx === '-' ? ' (randomly chosen)' : ''
						}! [${game.id}]` as ToTranslate
					);
					if (res.data.started) game.closeSignups(false);
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
					try {
						game.action(message.author, ctx, false);
					} catch (err) {
						// Regenerate the HTML if given an invalid input
						if (err instanceof ChatError) {
							game.update(message.author.id);
						}
						throw err;
					}
				},
			},
			...(Game.meta.autostart === false
				? ({
						start: {
							name: 'start',
							aliases: ['s', 'go', 'g'],
							help: 'Starts a game if it does not have an auto-start.',
							syntax: 'CMD [id]',
							perms: Symbol.for('games.create'),
							async run({ message, arg, $T }): Promise<void> {
								const { game } = getGame(arg, { action: 'start', user: message.author.id }, { room: message.target, $T });
								if (!game.startable()) throw new ChatError($T('GAME.CANNOT_START'));
								game.start();
								game.closeSignups(false);
							},
						},
					} satisfies PSCommand['children'])
				: {}),
			reaction: {
				name: 'reaction',
				aliases: ['x', '!!'],
				help: 'Performs an out-of-turn action.',
				syntax: 'CMD [id], [move]',
				async run({ message, arg, $T }): Promise<void> {
					const { game, ctx } = getGame(arg, { action: 'reaction', user: message.author.id }, { room: message.target, $T });
					game.action(message.author, ctx, true);
				},
			},
			audience: {
				name: 'audience',
				help: 'Allows an audience member to perform an action.',
				syntax: 'CMD [id], [move]',
				async run({ message, arg, $T }) {
					if (!('external' in Game.instance.prototype)) throw new ChatError($T('GAME.COMMAND_NOT_ENABLED'));
					const { game, ctx } = getGame(arg, { action: 'audience', user: message.author.id }, { room: message.target, $T });
					if (!game.external) throw new ChatError($T('CMD_NOT_FOUND'));
					game.external(message.author, ctx);
				},
			},
			end: {
				name: 'end',
				aliases: ['e'],
				help: 'Ends a game.',
				perms: Game.meta.players === 'single' ? 'regular' : Symbol.for('games.manage'),
				syntax: 'CMD [game ref]',
				async run({ message, arg, $T }) {
					const { game } = getGame(
						arg,
						Game.meta.players === 'single' ? { action: 'play', user: message.author.id } : { action: 'any' },
						{ room: message.target, $T }
					);
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
					if (Game.meta.players === 'single') throw new ChatError($T('GAME.COMMAND_NOT_ENABLED', { game: Game.meta.name }));
					const { game, ctx } = getGame(arg, { action: 'sub' }, { room: message.target, $T });
					const users = ctx.split(',').map(toId);
					const outUser = users.find(user => Object.values(game.players).some(player => player.id === user));
					const outTurn = Object.keys(game.players).find(turn => game.players[turn].id === outUser) as typeof game.turn;
					const inUserId = users.find(user => !Object.values(game.players).some(player => player.id === user));
					const inUser = inUserId ? message.parent.getUser(inUserId) : false;
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
					const res = game.removePlayer(toId(ctx));
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
					const rejoinGames = allGames.filter(game => game.hasPlayerOrSpectator(message.author.id));
					if (!rejoinGames.length) throw new ChatError($T('GAME.WATCHING_NOTHING'));
					rejoinGames.forEach(game => game.update(message.author.id));
				},
			},
			watch: {
				name: 'watch',
				aliases: ['w', 'spectate', 'spec'],
				help: 'Watches the given game.',
				syntax: 'CMD [game ref]',
				async run({ message, arg, $T }) {
					const { game } = getGame(arg, { action: 'watch', user: message.author.id }, { room: message.target, $T });
					if (game.hasPlayer(message.author.id)) throw new ChatError($T('GAME.ALREADY_JOINED'));
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
				aliases: ['uw', 'unspectate', 'uspec', 'unspec'],
				help: 'Unwatches the given game.',
				syntax: 'CMD [game ref]',
				async run({ message, arg, $T }) {
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
					message.reply(`/closehtmlpage ${message.author.id}, ${game.id}` as NoTranslate);
				},
			},
			...(Game.meta.mods
				? ({
						mod: {
							name: 'mod',
							aliases: ['#'],
							help: 'Modifies a given game.',
							perms: Symbol.for('games.create'),
							syntax: 'CMD [game ref] [mod]',
							async run({ message, arg, $T }) {
								const { game, ctx } = getGame(arg, { action: 'mod', user: message.author.id }, { room: message.target, $T });
								if (!game.moddable?.() || !game.applyMod) throw new ChatError($T('GAME.CANNOT_MOD'));
								const mod = parseMod(ctx, Game.meta.mods!.list, Game.meta.mods!.data);
								if (!mod) throw new ChatError($T('GAME.MOD_NOT_FOUND', { mod: ctx }));
								const applied = game.applyMod(mod);
								if (applied.success) message.reply(applied.data);
							},
						},
					} satisfies PSCommand['children'])
				: {}),
			...(Game.meta.themes
				? ({
						theme: {
							name: 'theme',
							aliases: ['t'],
							help: "Customizes a game's theme.",
							perms: Symbol.for('games.create'),
							syntax: 'CMD [game ref] [theme name]',
							async run({ message, arg, $T }) {
								const { game, ctx } = getGame(arg, { action: 'any' }, { room: message.target, $T });
								const result = game.setTheme(ctx);
								message.reply(result);
							},
						},
					} satisfies PSCommand['children'])
				: {}),
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
			stash: {
				name: 'stash',
				aliases: ['yeet'],
				help: 'Stashes a game to store it for later.',
				perms: Symbol.for('games.manage'),
				syntax: 'CMD [game ref]',
				async run({ message, arg, $T }) {
					const { game } = getGame(arg, { action: 'any' }, { room: message.target, $T });
					delete PSGames[gameId]?.[game.id];
					game.pokeTimer?.cancel();
					game.timer?.cancel();
					message.reply($T('GAME.STASHED', { id: game.id }));
				},
			},
			...(Game.meta.players === 'many'
				? {
						backups: {
							name: 'backups',
							aliases: ['bu', 'b'],
							help: 'Shows a list of currently available backups.',
							perms: Symbol.for('games.manage'),
							syntax: 'CMD',
							async run({ message }) {
								const HTML = renderBackups(message.target, Game.meta);
								message.sendHTML(HTML, { name: `${gameId}-backups` });
							},
						},
						restore: {
							name: 'restore',
							aliases: ['r', 'unstash', 'unyeet'],
							help: 'Restores a game from stash/backups.',
							perms: Symbol.for('games.manage'),
							syntax: 'CMD [id]',
							async run({ message, arg, $T }) {
								const id = arg.trim().toUpperCase();
								if (!/^#\w+$/.test(id)) throw new ChatError($T('GAME.INVALID_INPUT'));
								if (PSGames[gameId]?.[id]) throw new ChatError($T('GAME.IN_PROGRESS'));
								const lookup = gameCache.get(id);
								if (lookup.room !== message.target.roomid) throw new ChatError($T('WRONG_ROOM'));
								if (lookup.game !== gameId) throw new ChatError($T('GAME.RESTORING_WRONG_TYPE'));
								const game = new Game.instance({
									id: lookup.id,
									meta: Game.meta,
									room: message.target,
									$T,
									by: message.author,
									backup: lookup.backup,
									args: [],
								});
								message.reply($T('GAME.RESTORED', { id: game.id }));
								if (game.started) game.update();
								else game.signups();
							},
						},
					}
				: {}),
		},
	};
});
