import { ChannelType } from 'discord.js';

import { PSGames } from '@/cache';
import { gameCache } from '@/cache/games';
import { prefix } from '@/config/ps';
import { uploadGame } from '@/database/games';
import Discord from '@/discord';
import { botLogChannel } from '@/discord/constants/servers/boardgames';
import { renderCloseSignups, renderSignups } from '@/ps/games/render';
import { toHumanTime, toId } from '@/tools';
import { ChatError } from '@/utils/chatError';
import { log } from '@/utils/logger';
import { pick } from '@/utils/pick';
import { sample, useRNG } from '@/utils/random';
import { Timer } from '@/utils/timer';

import type { GameModel } from '@/database/games';
import type { TranslationFn } from '@/i18n/types';
import type { ActionResponse, BaseState, GamesList, Meta, Player } from '@/ps/games/common';
import type { Games } from '@/ps/games/index';
import type { EmbedBuilder } from 'discord.js';
import type { Client, Room, User } from 'ps-client';
import type { ReactElement } from 'react';

export type ActionType = 'general' | 'pregame' | 'ingame' | 'postgame';

const backupKeys = ['state', 'started', 'turn', 'turns', 'seed', 'players', 'log', 'startedAt', 'createdAt'] as const;

export class Game<State extends BaseState> {
	meta: Meta;
	id: string;
	$T: TranslationFn;
	seed: number = sample(1e12);
	prng: () => number = useRNG(this.seed);
	room: Room;
	parent: Client;
	roomid: string;
	// @ts-expect-error -- State isn't initialized yet
	state: State = {};
	log: { action: string; time: Date; turn: State['turn'] | null; ctx: unknown }[] = [];
	sides: boolean;

	startable?: boolean;
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
		msg: string;
	};

	players: Record<string, Player> = {};
	spectators: string[] = [];

	// Game-provided methods:
	render?(side: State['turn'] | null): ReactElement;
	renderEmbed?(): EmbedBuilder;

	action?(user: User, ctx: string): void;

	onAddPlayer?(user: User, ctx: string): ActionResponse<Record<string, unknown>>;
	onLeavePlayer?(player: Player, ctx: string | User): ActionResponse;
	onForfeitPlayer?(player: Player, ctx: string | User): ActionResponse;
	onReplacePlayer?(turn: State['turn'], withPlayer: User): ActionResponse<Player>;
	onStart?(): ActionResponse;
	onEnd?(type?: 'force' | 'dq'): string;
	trySkipPlayer?(turn: State['turn']): boolean;

	constructor(ctx: BaseContext) {
		this.id = ctx.id;
		this.room = ctx.room;
		this.roomid = ctx.room.id;
		this.parent = ctx.room.parent;
		this.$T = ctx.$T;

		this.meta = ctx.meta;
		this.renderCtx = { msg: `/msgroom ${ctx.room.id},/botmsg ${this.parent.status.userid},${prefix}@${ctx.room.id} ${ctx.meta.id}` };

		if (ctx.meta.turns) this.turns = Object.keys(ctx.meta.turns);
		this.sides = !!ctx.meta.turns;

		if (ctx.meta.timer) {
			this.timerLength = ctx.meta.timer;
			this.pokeTimerLength = ctx.meta.pokeTimer ?? ctx.meta.timer;
		}

		(PSGames[this.meta.id] ??= {})[this.id] = this as unknown as InstanceType<Games[GamesList]['instance']>;
		if (ctx.backup) {
			const parsedBackup: Pick<Game<BaseState>, (typeof backupKeys)[number]> = JSON.parse(ctx.backup);
			backupKeys.forEach(key => {
				switch (key) {
					case 'log':
					case 'state':
					case 'turn':
					case 'turns':
					case 'started':
					case 'createdAt':
					case 'startedAt': {
						// @ts-expect-error -- TS is going absolutely wild; FIXME
						if (key in parsedBackup) this[key] = parsedBackup[key];
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

	setTimer(comment: string): void {
		if (!this.timerLength || !this.pokeTimerLength) return;
		this.timer?.cancel();
		this.pokeTimer?.cancel();

		const turn = this.turn!;
		const timerLength = this.timerLength;
		const player = this.parent.getUser(this.players[turn].id);
		if (!player) {
			log('Unable to find player for ', { turn, game: this });
			return;
		}
		this.timer = new Timer(
			() => {
				this.room.send(`${player.name} hasn't played in ${this.meta.name} [${this.id}] for ${toHumanTime(timerLength)}...`);
			},
			this.timerLength,
			`${comment} [${this.id}]`
		);
		if (this.pokeTimerLength)
			this.pokeTimer = new Timer(
				() => {
					this.room.privateSend(player, `Psst it's your turn to play in ${this.meta.name} [${this.id}]`);
					this.room.send(`/notifyuser ${player.id}, ${this.meta.name}, Waiting for you to play...`);
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
		const backup = this.serialize();
		gameCache.set({ id: this.id, room: this.roomid, game: this.meta.id, backup });
	}

	signups(): void {
		if (this.started) throw new ChatError(this.$T('GAME.ALREADY_STARTED'));
		const signupsHTML = renderSignups.bind(this)();
		this.room.sendHTML(signupsHTML, { name: `${this.meta.id}${this.id}` });
	}
	closeSignups(): void {
		const closeSignupsHTML = renderCloseSignups.bind(this)();
		this.room.sendHTML(closeSignupsHTML, { name: `${this.meta.id}${this.id}` });
	}

	addPlayer(user: User, ctx: string): ActionResponse<{ started: boolean; as: State['turn'] }> {
		if (this.started) return { success: false, error: this.$T('GAME.ALREADY_STARTED') };
		const availableSlots: number | State['turn'][] = this.sides
			? this.turns.filter(turn => !this.players[turn])
			: this.meta.maxSize! - Object.keys(this.players).length;
		if (Object.values(this.players).some((player: Player) => player.id === user.id))
			throw new ChatError(this.$T('GAME.ALREADY_JOINED'));
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
			if (turn === '-') turn = availableSlots.random();
			else if (!availableSlots.includes(turn))
				return { success: false, error: this.$T('GAME.INVALID_SIDE', { sides: availableSlots.list(this.$T) }) };
			newPlayer.turn = turn;
		}
		if (this.onAddPlayer) {
			const extraData = this.onAddPlayer(user, ctx);
			if (!extraData.success) return extraData;
			Object.assign(newPlayer, extraData);
		}
		if (this.turns) this.startable = Array.isArray(availableSlots) && availableSlots.length === 1;
		else {
			const playerCount = Object.keys(this.players).length;
			if (playerCount <= this.meta.maxSize!) {
				if (!this.meta.minSize || playerCount >= this.meta.minSize) this.startable = true;
			}
		}
		this.players[newPlayer.turn] = newPlayer;
		if ((Array.isArray(availableSlots) && availableSlots.length === 1) || availableSlots === 1) {
			// Join was successful and game is now full
			if (this.meta.autostart) this.start();
			return { success: true, data: { started: true, as: newPlayer.turn } };
			// TODO: Maybe add a hint to start game?
		}
		return { success: true, data: { started: false, as: newPlayer.turn } };
	}

	// ctx: string for DQ; ctx: User for self-leave
	removePlayer(ctx: string | User): ActionResponse<{ message: string; cb?: () => void }> {
		const staffAction = typeof ctx === 'string';
		const player = Object.values(this.players).find(p => p.id === (typeof ctx === 'string' ? ctx : ctx.id));
		if (!player) return { success: false, error: this.$T('GAME.NOT_PLAYING') };
		if (this.started) {
			const forfeitPlayer = this.onForfeitPlayer?.(player, ctx);
			if (forfeitPlayer?.success === false) return forfeitPlayer;
			player.out = true;
			return {
				success: true,
				data: {
					message: staffAction ? `${player.name} has been disqualified from the game.` : 'You have forfeited the game.',
					cb: () => {
						const playersLeft = Object.values(this.players).filter((player: Player) => !player.out);
						if (playersLeft.length <= 1) this.end('dq');
						else if (this.turn === player.turn) this.nextPlayer(); // Needs to be run AFTER consumer has finished DQing
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
				message: staffAction ? `${player.name} has been removed from the game.` : 'You have left the game',
			},
		};
	}

	replacePlayer(turn: State['turn'], withPlayer: User): ActionResponse<string> {
		if (Object.values(this.players).some((player: Player) => player.id === withPlayer.id))
			throw new ChatError(this.$T('GAME.IMPOSTOR_ALERT'));
		const assign: Partial<Player> = {
			name: withPlayer.name,
			id: withPlayer.id,
		};
		if (this.onReplacePlayer) {
			const res = this.onReplacePlayer(turn, withPlayer);
			if (!res.success) throw new ChatError(res.error);
			if (res.data) Object.assign(assign, res.data);
		}
		const oldPlayer = this.players[turn];
		this.players[turn] = { ...oldPlayer, ...assign };
		this.spectators.remove(oldPlayer.id);
		return { success: true, data: this.$T('GAME.SUB', { in: withPlayer.name, out: oldPlayer.name }) };
	}

	start(): ActionResponse {
		const tryStart = this.onStart?.();
		if (tryStart?.success === false) return tryStart;
		this.started = true;
		this.turns ??= Object.keys(this.players).shuffle();
		this.nextPlayer();
		this.startedAt = new Date();
		this.setTimer('Game started');
		return { success: true };
	}

	next(current = this.turn): State['turn'] {
		const baseIndex = this.turns.indexOf(current!);
		return this.turns[(baseIndex + 1) % this.turns.length];
	}

	nextPlayer(): State['turn'] | null {
		let current = this.turn;
		do {
			current = this.next(current);
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
		if ('render' in this && typeof this.render === 'function') {
			if (user) {
				const asPlayer = Object.values(this.players).find(player => player.id === user);
				if (asPlayer) return this.sendHTML(asPlayer.id, this.render(asPlayer.turn));
				if (this.spectators.includes(user)) return this.sendHTML(user, this.render(null));
				throw new ChatError('User not in players/spectators');
			}
			// TODO: Add ping to ps-client HTML opts
			Object.keys(this.players).forEach(side => this.sendHTML(this.players[side].id, this.render!(side)));
			this.room.send(`/highlighthtmlpage ${this.players[this.turn!].id}, ${this.id}, Your turn!`);
			this.room.pageHTML(this.spectators, this.render(null), { name: this.id });
		}
	}

	end(type?: 'force' | 'dq'): void {
		const message = this.onEnd!(type);
		this.clearTimer();
		this.update();
		if (this.started) {
			// TODO: Revisit broadcasting logic for single-player games
			this.room.sendHTML(this.render!(null));
		}
		this.endedAt = new Date();
		this.room.send(message);
		if (this.started && this.renderEmbed && this.roomid === 'boardgames') {
			const embed = this.renderEmbed();
			// Send only for games from BG
			const channel = Discord.channels.cache.get(botLogChannel);
			if (channel && channel.type === ChannelType.GuildText) channel.send({ embeds: [embed] });
		}
		// Upload to DB
		const model: GameModel = {
			id: this.id,
			game: this.meta.id,
			room: this.roomid,
			players: new Map(Object.entries(this.players)),

			log: this.log.map(entry => JSON.stringify(entry)),

			created: this.createdAt,
			started: this.startedAt!,
			ended: this.endedAt!,
		};
		uploadGame(model).catch(err => {
			log(err);
			throw new Error(`Failed to upload game ${this.id}`);
		});
		// Delete from cache
		delete PSGames[this.meta.id]![this.id];
		gameCache.delete(this.id);
	}
}

export type BaseContext = { room: Room; id: string; meta: Meta; $T: TranslationFn; backup?: string };

export function createGrid<T>(x: number, y: number, fill: (x: number, y: number) => T) {
	return Array.from({ length: x }).map((_, i) => Array.from({ length: y }).map((_, j) => fill(i, j)));
}
