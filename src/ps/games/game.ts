import { prefix } from '@/config/ps';
import { sample, useRNG } from '@/utils/random';
import { PSGames } from '@/cache';

import type { Room, User } from 'ps-client';
import { ActionResponse, BaseGameTypes, BasePlayer, BaseState, GamesList, Meta } from '@/ps/games/common';
import type { ReactElement } from 'react';
import { renderCloseSignups, renderSignups } from '@/ps/games/render';
import { Games } from '@/ps/games/index';
import { TranslationFn } from '@/i18n/types';

export type ActionType = 'general' | 'pregame' | 'ingame' | 'postgame';

export class Game<State extends BaseState, GameTypes extends BaseGameTypes> {
	meta: Meta;
	id: string;
	$T: TranslationFn;
	seed: number;
	prng: () => number;
	room: Room;
	roomid: string;
	state: State;
	log: string;
	sides: boolean;

	startable?: boolean;
	started: boolean;

	allowForfeits?: boolean;

	turn: State['turn'] | null;
	turns: State['turn'][];

	renderCtx: {
		msg: string;
	};

	players: Record<State['turn'], BasePlayer & GameTypes['player']>;
	spectators: string[];

	// Game-provided methods:
	render?(side: State['turn'] | null): ReactElement;

	action?(user: User, ctx: string): void;

	onAddPlayer?(user: User, ctx: string): ActionResponse<Record<string, unknown>>;
	onRemovePlayer?(player: BasePlayer, ctx: string | User): ActionResponse;
	onReplacePlayer?(turn: State['turn'], withPlayer: User): ActionResponse<BasePlayer & GameTypes['player']>;
	onStart?(): ActionResponse;
	onEnd?(): string;
	trySkipPlayer?(turn: State['turn']): boolean;

	constructor(ctx: BaseContext) {
		this.id = ctx.id;
		this.room = ctx.room;
		this.roomid = ctx.room.id;
		this.$T = ctx.$T;

		this.seed = sample(1e12);
		this.prng = useRNG(this.seed);

		this.meta = ctx.meta;
		this.renderCtx = { msg: `/msgroom ${ctx.room.id},/botmsg ${PS.status.userid},${prefix}@${ctx.room.id} ${ctx.meta.id}` };

		this.started = false;
		// @ts-expect-error -- State isn't initialized yet
		this.state = {};
		// @ts-expect-error -- Players aren't initialized yet
		this.players = {};
		this.turn = null;
		this.turns = [];
		this.sides = !!ctx.meta.turns;
		this.spectators = [];
		this.log = '';

		(PSGames[this.meta.id] ??= {})[this.id] = this as unknown as InstanceType<Games[GamesList]['instance']>;
	}

	serialize(): string {
		const preserveKeys = ['state', 'started', 'turn', 'turns', 'seed', 'players', 'log'];
		return ''; // TODO
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
		if (Object.values(this.players).some((player: BasePlayer) => player.id === user.id))
			throw new ChatError(this.$T('GAME.ALREADY_JOINED'));
		const newPlayer: BasePlayer = {
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

	removePlayer(ctx: string | User): ActionResponse {
		if (this.started) {
			if (!this.allowForfeits) return { success: false, error: this.$T('GAME.ALREADY_STARTED') };
			// TODO: Support forfeits
			return { success: true };
		}
		if (typeof ctx === 'string') {
			// TODO: Support staff DQs
			return { success: true };
		} else {
			const player = (Object.values(this.players) as BasePlayer[]).find(p => p.id === ctx.id);
			if (!player) return { success: false, error: this.$T('GAME.NOT_PLAYING') };
			const removePlayer = this.onRemovePlayer?.(player, ctx);
			if (removePlayer?.success === false) return removePlayer;
			delete this.players[player.turn];
			return { success: true };
		}
	}

	replacePlayer(turn: State['turn'], withPlayer: User): ActionResponse<string> {
		if (Object.values(this.players).some((player: BasePlayer) => player.id === withPlayer.id))
			throw new ChatError(this.$T('GAME.IMPOSTOR_ALERT'));
		const assign: Partial<BasePlayer> = {
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
			if (!this.trySkipPlayer || !this.trySkipPlayer(current)) {
				this.turn = current;
				this.update();
				return current;
			}
		} while (current !== this.turn);
		return null;
	}

	sendHTML(to: string | User, html: ReactElement | string): void {
		const user = typeof to === 'object' ? to : PS.addUser({ userid: Tools.toId(to) });
		user.pageHTML(html, { name: this.id, room: this.room });
	}

	update(user?: string) {
		if ('render' in this && typeof this.render === 'function') {
			if (user) {
				const asPlayer = (Object.values(this.players) as BasePlayer[]).find(player => player.id === user);
				if (asPlayer) return this.sendHTML(asPlayer.id, this.render(asPlayer.turn));
				if (this.spectators.includes(user)) return this.sendHTML(user, this.render(null));
				throw new ChatError('User not in players/spectators');
			}
			Object.keys(this.players).forEach(side => this.sendHTML(this.players[side].id, this.render!(side)));
			this.room.pageHTML(this.spectators, this.render(null), { name: this.id });
		}
	}

	end(): void {
		const message = this.onEnd!();
		this.update();
		// TODO: Render finish HTML in chat
		this.room.send(message);
		// TODO: Upload to Discord
		// Delete from cache
		delete PSGames[this.meta.id]![this.id];
		// TODO: Delete backup
	}
}

export type BaseContext = { room: Room; id: string; meta: Meta; $T: TranslationFn; backup?: string };

export function createGrid<T>(x: number, y: number, fill: (x: number, y: number) => T) {
	return Array.from({ length: x }).map((_, i) => Array.from({ length: y }).map((_, j) => fill(i, j)));
}
