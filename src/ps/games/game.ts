import { prefix } from '@/config/ps';

import type { Room, User } from 'ps-client';
import type { ActionResponse, BaseGameTypes, BasePlayer, BaseState } from '@/ps/games/common';
import type { ReactElement } from 'react';

export type ActionType = 'general' | 'pregame' | 'ingame' | 'postgame';

import { GAME } from '@/text';
import { sample, useRNG } from '@/utils/random';

export class Game<State extends BaseState, GameTypes extends BaseGameTypes> {
	game: string; // TODO: Make this an enum
	id: string;
	seed: number;
	prng: () => number;
	room: Room;
	roomid: string;
	state: State;
	log: string;

	maxSize?: number;
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

	onAddPlayer?(user: User, ctx: string[]): ActionResponse<Record<string, unknown>>;
	onRemovePlayer?(player: BasePlayer, ctx: string | User): ActionResponse;
	onStart?(): ActionResponse;
	onEnd?(): string;
	trySkipPlayer?(turn: State['turn']): boolean;

	constructor(ctx: BaseContext) {
		this.id = ctx.id;
		this.room = ctx.room;
		this.roomid = ctx.room.id;

		this.seed = sample(1e6);
		this.prng = useRNG(this.seed);

		this.game = ctx.game;
		this.renderCtx = { msg: `/msgroom ${ctx.room.id},/botmsg ${PS.status.userid},${prefix}${ctx.game} #` };

		this.started = false;
		// @ts-expect-error -- State isn't initialized yet
		this.state = {};
		// @ts-expect-error -- Players aren't initialized yet
		this.players = {};
		this.turn = null;
		this.turns = [];
		this.spectators = [];

		// TODO: Add to cache
	}

	addPlayer(user: User, ctx: string[]): ActionResponse {
		if (this.started) return { success: false, error: GAME.ALREADY_STARTED };
		const availableSlots: number | State['turn'][] = this.turns
			? this.turns.filter(turn => !this.players[turn])
			: this.maxSize - Object.keys(this.players).length;
		const newPlayer: BasePlayer = {
			name: user.name,
			id: user.id,
			turn: user.id,
		};
		if (typeof availableSlots === 'number') {
			if (availableSlots === 0) return { success: false, error: GAME.IS_FULL };
		}
		if (Array.isArray(availableSlots)) {
			if (availableSlots.length === 0) return { success: false, error: GAME.IS_FULL };
			let turn = ctx[0] as State['turn'];
			// `-` is the 'random' side
			if (turn === '-') turn = availableSlots.random();
			else if (!availableSlots.includes(turn)) return { success: false, error: GAME.INVALID_SIDE(availableSlots) };
			newPlayer.turn = turn;
		}
		if (this.onAddPlayer) {
			const extraData = this.onAddPlayer(user, ctx);
			if (extraData.success === false) return extraData;
			Object.assign(newPlayer, extraData);
		}
		this.players[newPlayer.turn] = newPlayer;
		return { success: true };
		// TODO: Autostart for relevant games
	}

	removePlayer(ctx: string | User): ActionResponse {
		if (this.started) {
			if (!this.allowForfeits) return { success: false, error: GAME.ALREADY_STARTED };
			// TODO: Support forfeits
		}
		if (typeof ctx === 'string') {
			// TODO: Support staff DQs
		} else {
			const player = (Object.values(this.players) as BasePlayer[]).find(p => p.id === ctx.id);
			if (!player) return { success: false, error: GAME.NOT_PLAYING.random() };
			const removePlayer = this.onRemovePlayer?.(player, ctx);
			if (removePlayer.success === false) return removePlayer;
			delete this.players[player.turn];
			return { success: true };
		}
	}

	start(): ActionResponse {
		const tryStart = this.onStart?.();
		if (tryStart?.success === false) return tryStart;
		this.started = true;
		this.turns ??= Object.keys(this.players).shuffle();
		this.nextPlayer();
	}

	next(current = this.turn): State['turn'] {
		const baseIndex = this.turns.indexOf(current);
		return this.turns[(baseIndex + 1) % this.turns.length];
	}

	nextPlayer(): State['turn'] | null {
		let current = this.turn;
		do {
			current = this.next(current);
			if (!this.trySkipPlayer || !this.trySkipPlayer(current)) {
				this.turn = current
				this.update();
				return current;
			}
		} while (current !== this.turn);
		return null;
	}

	sendHTML(to: string | User, html: ReactElement | string): void {
		const user = typeof to === 'object' ? to : PS.addUser({ userid: Tools.toId(to) });
		user.pageHTML(html, { name: this.id });
	}

	update() {
		if ('render' in this && typeof this.render === 'function') {
			Object.keys(this.players).forEach(side => this.sendHTML(this.players[side].id, this.render(side)));
			this.spectators.forEach(spec => this.sendHTML(spec, this.render(null)));
			// TODO: Replace the line above with the line below once PS supports sending HTML pages to multiple people
			// this.room.send(`/sendhtmlpage ${this.spectators.join(';')},${this.id},${this.render(null)}`);
		}
	}

	end(): void {
		const message = this.onEnd();
		// TODO: Render finish HTML
		this.room.send(message);
		// TODO: Upload to Discord
		// TODO: Delete from cache
	}
}

export type BaseContext = { room: Room; id: string; game: string; backup?: string }; // TODO: Game should be an enum

export function createGrid<T>(x: number, y: number, fill: (x: number, y: number) => T) {
	return Array.from({ length: x }).map((_, i) => Array.from({ length: y }).map((__, j) => fill(i, j)));
}
