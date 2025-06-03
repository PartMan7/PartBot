import { PSGames } from '@/cache';
import { gameCache } from '@/cache/games';
import { prefix } from '@/config/ps';
import { uploadGame } from '@/database/games';
import { BOT_LOG_CHANNEL } from '@/discord/constants/servers/boardgames';
import { getChannel } from '@/discord/loaders/channels';
import { IS_ENABLED } from '@/enabled';
import { renderCloseSignups, renderSignups } from '@/ps/games/render';
import { toHumanTime, toId } from '@/tools';
import { ChatError } from '@/utils/chatError';
import { log } from '@/utils/logger';
import { pick } from '@/utils/pick';
import { sample, useRNG } from '@/utils/random';
import { Timer } from '@/utils/timer';

import type { GameModel } from '@/database/games';
import type { NoTranslate, PSRoomTranslated, ToTranslate, TranslatedText, TranslationFn } from '@/i18n/types';
import type { ActionResponse, BaseLog, BaseState, EndType, Meta, Player } from '@/ps/games/common';
import type { EmbedBuilder } from 'discord.js';
import type { Client, User } from 'ps-client';
import type { ReactElement } from 'react';

const backupKeys = ['state', 'started', 'turn', 'turns', 'seed', 'players', 'mod', 'theme', 'log', 'startedAt', 'createdAt'] as const;

/**
 * This is the shared code for all games. To check the game-specific code, refer to the
 * extended constructor in `$game/index.ts` and go through the `action` method.
 */
export class BaseGame<State extends BaseState> {
	meta: Meta;
	id: string;
	$T: TranslationFn;
	seed: number = sample(1e12);
	prng: () => number = useRNG(this.seed);
	room: PSRoomTranslated;
	parent: Client;
	roomid: string;
	// @ts-expect-error -- State isn't initialized yet
	state: State = {};
	log: BaseLog[] = [];
	sides: boolean;

	started: boolean = false;
	createdAt: Date = new Date();
	startedAt?: Date;
	endedAt?: Date;

	pokeTimer?: Timer;
	timer?: Timer;
	pokeTimerLength?: number | false;
	timerLength?: number;

	turn: State['turn'] | null = null;
	turns: State['turn'][] = [];

	renderCtx: {
		// Automatically include info like room and game ID in the command
		msg: string;
		// Remove game ID handling and use the generic message instead
		simpleMsg: string;
	};

	players: Record<BaseState['turn'], Player> = {};
	spectators: string[] = [];

	theme?: string;
	mod?: string | null;

	// Game-provided methods:
	render(side: State['turn'] | null): ReactElement;
	render() {
		return null as unknown as ReactElement;
	}
	renderEmbed?(): Promise<EmbedBuilder | null>;

	action(user: User, ctx: string, reaction: boolean): void;
	action() {}

	external?(user: User, ctx: string): void;

	onAddPlayer?(user: User, ctx: string): ActionResponse<Record<string, unknown>>;
	onLeavePlayer?(player: Player, ctx: string | User): ActionResponse;
	onForfeitPlayer?(player: Player, ctx: string | User): ActionResponse;
	onReplacePlayer?(turn: BaseState['turn'], withPlayer: User): ActionResponse<null>;
	onStart?(): ActionResponse;
	onEnd(type?: EndType): TranslatedText;
	onEnd() {
		return 'Game ended';
	}
	trySkipPlayer?(turn: BaseState['turn']): boolean;
	moddable?(): boolean;
	applyMod?(mod: string): ActionResponse<TranslatedText>;
	canBroadcastFinish?(): boolean;

	throw(msg?: Parameters<TranslationFn>[0], vars?: Parameters<TranslationFn>[1]): never {
		if (!msg) throw new ChatError(this.$T('GAME.INVALID_INPUT'));
		throw new ChatError(this.$T(msg, vars));
	}

	constructor(ctx: BaseContext) {
		this.id = ctx.id;
		this.room = ctx.room;
		this.roomid = ctx.room.id;
		this.parent = ctx.room.parent;
		this.$T = ctx.$T;

		this.meta = ctx.meta;
		this.renderCtx = {
			msg: `/msgroom ${ctx.room.id},/botmsg ${this.parent.status.userid},${prefix}@${ctx.id}`,
			simpleMsg: `/msgroom ${ctx.room.id},/botmsg ${this.parent.status.userid},${prefix}@${ctx.room.id} ${ctx.meta.id}`,
		};

		if (ctx.meta.turns) this.turns = Object.keys(ctx.meta.turns);
		this.sides = !!ctx.meta.turns;

		if (ctx.meta.timer) {
			this.timerLength = ctx.meta.timer;
			this.pokeTimerLength = ctx.meta.pokeTimer ?? ctx.meta.timer;
		}

		if (ctx.meta.defaultTheme) this.theme = ctx.meta.defaultTheme;
	}
	persist(ctx: BaseContext) {
		if (!PSGames[this.meta.id]) PSGames[this.meta.id] = {};
		PSGames[this.meta.id]![this.id] = this as CommonGame;
		if (ctx.backup) {
			const parsedBackup: Pick<CommonGame, (typeof backupKeys)[number]> = JSON.parse(ctx.backup);
			backupKeys.forEach(key => {
				switch (key) {
					case 'log':
					case 'state':
					case 'turn':
					case 'turns':
					case 'started':
					case 'mod': {
						// @ts-expect-error -- key isn't narrowed correctly
						if (key in parsedBackup) this[key] = parsedBackup[key];
						break;
					}
					case 'createdAt':
					case 'startedAt': {
						if (key in parsedBackup) this[key] = new Date(parsedBackup[key]!);
						break;
					}
					case 'seed': {
						this.seed = parsedBackup.seed;
						this.prng = useRNG(this.seed);
						break;
					}
					case 'players': {
						// Honestly, at this point I just want to yeet custom data in players
						this.players = parsedBackup.players;
						break;
					}
				}
			});
		}
	}
	after(ctx: BaseContext) {
		if (this.meta.players === 'single') {
			this.addPlayer(ctx.by, null);
			this.closeSignups(false);
		}
	}

	setTimer(comment: string): void {
		if (!this.timerLength || !this.pokeTimerLength) return;
		this.clearTimer();

		const turn = this.turn!;
		const timerLength = this.timerLength;
		const player = this.parent.getUser(this.players[turn].id);
		if (!player) {
			log('Unable to find player for ', { turn, game: this });
			return;
		}
		this.timer = new Timer(
			() => {
				this.room.send(
					this.$T('GAME.TIMER.PUBLIC', {
						user: player.name,
						game: this.meta.name,
						id: this.id,
						time: toHumanTime(timerLength, undefined, this.$T),
					})
				);
			},
			this.timerLength,
			`${comment} [${this.id}]`
		);
		if (this.pokeTimerLength)
			this.pokeTimer = new Timer(
				() => {
					this.room.privateSend(player, this.$T('GAME.TIMER.PRIVATE', { game: this.meta.name, id: this.id }));
					this.room.send(`/notifyuser ${player.id}, ${this.meta.name}, ${this.$T('GAME.WAITING')}` as TranslatedText);
					// TODO: Use ping when ps-client supports
					// this.room.ping(player, { title: this.meta.name, label: 'Waiting for you to play...' });
				},
				this.pokeTimerLength,
				`Poke for ${comment} [${this.id}]`
			);
	}
	clearTimer(): void {
		this.timer?.cancel();
		this.pokeTimer?.cancel();
	}

	serialize(): string {
		const sparseGame = pick(this, backupKeys);
		return JSON.stringify(sparseGame);
	}
	backup(): void {
		if (this.meta.players === 'single') return; // Don't back up single-player games
		const backup = this.serialize();
		gameCache.set({ id: this.id, room: this.roomid, game: this.meta.id, backup, at: Date.now() });
	}

	setTheme(input: string): TranslatedText {
		if (!this.meta.themes) this.throw('GAME.NO_THEME_SUPPORT', { game: this.meta.name });
		const themeId = toId(input);
		const allThemes = Object.values(this.meta.themes);
		const selectedTheme = allThemes.find(theme => toId(theme.name) === themeId || theme.aliases.includes(themeId));
		if (!selectedTheme) this.throw('GAME.INVALID_THEME', { themes: allThemes.map(theme => theme.name).list(this.$T) });
		this.theme = selectedTheme.id;
		this.update();
		return this.$T('GAME.SET_THEME', { theme: selectedTheme.name });
	}

	renderSignups?(staff: boolean): ReactElement | null;
	signups(): void {
		if (this.started) this.throw('GAME.ALREADY_STARTED');
		const signupRenderer = (this.renderSignups ?? renderSignups).bind(this);
		const signupsHTML = signupRenderer(false);
		if (signupsHTML) this.room.sendHTML(signupsHTML, { name: this.id });
		if (this.meta.autostart === false) {
			const staffHTML = signupRenderer(true);
			// TODO: Sync this rank with games.create perms
			if (staffHTML) this.room.sendHTML(staffHTML, { name: this.id, rank: '+', change: true });
		}
	}
	// TODO: Handle max players state
	renderCloseSignups?(): ReactElement;
	closeSignups(change = true): void {
		const closeSignupsHTML = (this.renderCloseSignups ?? renderCloseSignups).bind(this)();
		if (closeSignupsHTML) this.room.sendHTML(closeSignupsHTML, { name: this.id, change });
	}

	addPlayer(user: User, ctx: string | null): ActionResponse<{ started: boolean; as: BaseState['turn'] }> {
		if (this.started) return { success: false, error: this.$T('GAME.ALREADY_STARTED') };
		if (this.meta.players === 'single' && Object.keys(this.players).length >= 1) this.throw('GAME.IS_FULL');
		const availableSlots: number | State['turn'][] = this.sides
			? this.turns.filter(turn => !this.players[turn])
			: this.meta.maxSize! - Object.keys(this.players).length;
		if (Object.values(this.players).some((player: Player) => player.id === user.id)) this.throw('GAME.ALREADY_JOINED');
		const newPlayer: Player = {
			name: user.name,
			id: user.id,
			turn: user.id,
		};
		if (typeof availableSlots === 'number') {
			if (availableSlots === 0) return { success: false, error: this.$T('GAME.IS_FULL') };
		}
		if (Array.isArray(availableSlots)) {
			if (availableSlots.length === 0) return { success: false, error: this.$T('GAME.IS_FULL') };
			let turn = ctx as State['turn'];
			// `-` is the 'random' side
			if (turn === '-') turn = availableSlots.random(this.prng)!;
			else if (!availableSlots.includes(turn))
				return { success: false, error: this.$T('GAME.INVALID_SIDE', { sides: availableSlots.list(this.$T) }) };
			newPlayer.turn = turn;
		}
		if (this.onAddPlayer) {
			const extraData = this.onAddPlayer(user, ctx as string);
			if (!extraData.success) return extraData;
			Object.assign(newPlayer, extraData.data);
		}
		this.players[newPlayer.turn] = newPlayer;
		if (this.meta.players === 'single' || (Array.isArray(availableSlots) && availableSlots.length === 1) || availableSlots === 1) {
			// Join was successful and game is now full
			if (this.meta.players === 'single' || this.meta.autostart) this.start();
			this.backup();
			return { success: true, data: { started: true, as: newPlayer.turn } };
		}
		this.backup();
		return { success: true, data: { started: false, as: newPlayer.turn } };
	}

	// ctx: string for DQ; ctx: User for self-leave
	removePlayer(ctx: string | User): ActionResponse<{ message: TranslatedText; cb?: () => void }> {
		const staffAction = typeof ctx === 'string';
		const player = Object.values(this.players).find(p => p.id === (typeof ctx === 'string' ? ctx : ctx.id));
		if (!player) return { success: false, error: this.$T('GAME.NOT_PLAYING') };
		if (this.started) {
			const forfeitPlayer = this.onForfeitPlayer?.(player, ctx);
			if (forfeitPlayer?.success === false) return forfeitPlayer;
			player.out = true;
			this.log.push({ action: staffAction ? 'dq' : 'forfeit', turn: player.turn, time: new Date(), ctx: null });
			return {
				success: true,
				data: {
					message: (staffAction
						? `${player.name} has been disqualified from the game.`
						: 'You have forfeited the game.') as ToTranslate,
					cb: () => {
						const playersLeft = Object.values(this.players).filter((player: Player) => !player.out);
						if (playersLeft.length <= 1) this.end('dq');
						else if (this.turn === player.turn) this.nextPlayer(); // Needs to be run AFTER consumer has finished DQing
						this.backup();
					},
				},
			};
		}
		const removePlayer = this.onLeavePlayer?.(player, ctx);
		if (removePlayer?.success === false) return removePlayer;
		delete this.players[player.turn];
		return {
			success: true,
			data: {
				message: (staffAction ? `${player.name} has been removed from the game.` : 'You have left the game.') as ToTranslate,
			},
		};
	}

	replacePlayer(_turn: BaseState['turn'], withPlayer: User): ActionResponse<TranslatedText> {
		const turn = _turn as State['turn'];
		if (Object.values(this.players).some((player: Player) => player.id === withPlayer.id)) this.throw('GAME.IMPOSTOR_ALERT');
		const assign: Partial<Player> = {
			name: withPlayer.name,
			id: withPlayer.id,
		};
		if (this.onReplacePlayer) {
			const res = this.onReplacePlayer(turn, withPlayer);
			if (!res.success) throw new ChatError(res.error);
		}
		const oldPlayer = this.players[turn];
		delete this.players[oldPlayer.id];
		const newTurn = this.meta.turns ? turn : withPlayer.id;
		this.players[newTurn] = { ...oldPlayer, ...assign, turn: newTurn };
		this.spectators.remove(oldPlayer.id);
		this.backup();
		return { success: true, data: this.$T('GAME.SUB', { in: withPlayer.name, out: oldPlayer.name }) };
	}

	hasPlayer(name: string): boolean {
		const userId = toId(name);
		return Object.values(this.players).some(player => player.id === userId);
	}

	hasPlayerOrSpectator(name: string): boolean {
		const userId = toId(name);
		return this.hasPlayer(userId) || this.spectators.includes(userId);
	}

	startable(): boolean {
		if (this.started) return false;
		if (this.turns?.length) return this.turns.every(turn => this.players[turn]);
		else {
			const playerCount = Object.keys(this.players).length;
			if (playerCount <= this.meta.maxSize!) {
				if (!this.meta.minSize || playerCount >= this.meta.minSize) return true;
			}
		}
		return false;
	}

	start(): ActionResponse {
		const tryStart = this.onStart?.();
		if (tryStart?.success === false) return tryStart;
		this.started = true;
		if (!this.turns.length) this.turns = Object.keys(this.players).shuffle();
		this.nextPlayer();
		this.startedAt = new Date();
		this.setTimer('Game started');
		this.backup();
		return { success: true, data: null };
	}

	// Only gets next turn. No side effects.
	getNext(current = this.turn): State['turn'] {
		const baseIndex = this.turns.indexOf(current!);
		return this.turns[(baseIndex + 1) % this.turns.length];
	}

	// Increments turn as needed and backs up state.
	nextPlayer(): State['turn'] | null {
		let current = this.turn;
		do {
			current = this.getNext(current);
			const currentPlayer = this.players[current];
			if (!currentPlayer) throw new Error(`Could not find ${current} in ${Object.keys(this.players)} from ${this.turns}`);
			if (currentPlayer.out) continue;
			if (!this.trySkipPlayer || !this.trySkipPlayer(current)) {
				this.turn = current;
				this.update();
				this.backup();
				this.setTimer('Next turn');
				return current;
			}
			this.log.push({ action: 'skip', turn: current, time: new Date(), ctx: null });
		} while (current !== this.turn);
		this.clearTimer();
		return null;
	}

	sendHTML(to: string | User, html: ReactElement | string): void {
		const user = typeof to === 'object' ? to : this.parent.addUser({ userid: toId(to) });
		user.pageHTML(html, { name: this.id, room: this.room });
	}

	update(user?: string) {
		if (!this.started) return;
		if (user) {
			const asPlayer = Object.values(this.players).find(player => player.id === user);
			if (asPlayer) return this.sendHTML(asPlayer.id, this.render(asPlayer.turn));
			if (this.spectators.includes(user)) return this.sendHTML(user, this.render(null));
			this.throw('GAME.NON_PLAYER_OR_SPEC');
		}
		// TODO: Add ping to ps-client HTML opts
		Object.entries(this.players).forEach(([side, player]) => {
			if (!player.out) this.sendHTML(player.id, this.render(side));
		});
		this.room.send(`/highlighthtmlpage ${this.players[this.turn!].id}, ${this.id}, ${this.$T('GAME.YOUR_TURN')}` as TranslatedText);
		if (this.spectators.length > 0) this.room.pageHTML(this.spectators, this.render(null), { name: this.id });
	}

	getURL(): Promise<string | null> | string | null {
		if (this.meta.players === 'single') return null;
		return `${process.env.WEB_URL}/${this.meta.id}/${this.id.replace(/^#/, '')}`;
	}

	end(type?: EndType): void {
		const message = this.onEnd(type);
		this.clearTimer();
		this.update();
		if (this.started && (this.meta.players === 'many' || this.canBroadcastFinish?.())) {
			this.room.sendHTML(this.render(null));
		}
		this.endedAt = new Date();
		this.room.send(message);
		if (this.started && typeof this.renderEmbed === 'function' && this.roomid === 'boardgames') {
			// Send only for games from BG
			this.renderEmbed().then(embed => {
				if (embed) {
					const channel = getChannel(BOT_LOG_CHANNEL);
					channel?.send({ embeds: [embed] });
				}
			});
		}
		// Upload to DB
		if (IS_ENABLED.DB && this.started && this.meta.players !== 'single') {
			const model: GameModel = {
				id: this.id,
				game: this.meta.id,
				room: this.roomid,
				players: new Map(Object.entries(this.players)),
				log: this.log.map(entry => JSON.stringify(entry)),
				created: this.createdAt,
				started: this.startedAt!,
				ended: this.endedAt!,
				winCtx: 'winCtx' in this ? this.winCtx : null,
			};
			uploadGame(model)
				.then(async () => {
					const replay = await this.getURL();
					if (replay) this.room.send(replay as NoTranslate);
				})
				.catch(err => {
					log(err);
					this.room.send(this.$T('GAME.UPLOAD_FAILED', { id: this.id }));
				});
		}
		// Delete from cache
		delete PSGames[this.meta.id]![this.id];
		gameCache.delete(this.id);
	}
}

export type BaseContext = {
	by: User;
	room: PSRoomTranslated;
	id: string;
	meta: Meta;
	$T: TranslationFn;
	backup?: string;
	args: string[];
};

export function createGrid<T>(x: number, y: number, fill: (x: number, y: number) => T) {
	return Array.from({ length: x }).map((_, i) => Array.from({ length: y }).map((_, j) => fill(i, j)));
}

/** Non-generic type representing only the things all games have in common */
export type CommonGame = BaseGame<BaseState>;
