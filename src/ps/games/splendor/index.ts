import { BaseGame } from '@/ps/games/game';
import {
	ACTIONS,
	AllTokenTypes,
	MAX_RESERVE_COUNT,
	MAX_TOKEN_COUNT,
	POINTS_TO_WIN,
	TOKEN_TYPE,
	TokenTypes,
	VIEW_ACTION_TYPE,
} from '@/ps/games/splendor/constants';
import metadata from '@/ps/games/splendor/metadata.json';
import { render, renderLog } from '@/ps/games/splendor/render';
import { ChatError } from '@/utils/chatError';
import { toId } from '@/utils/toId';

import type { TranslatedText } from '@/i18n/types';
import type { BaseContext } from '@/ps/games/game';
import type { Log } from '@/ps/games/splendor/logs';
import type { Card, PlayerData, RenderCtx, State, TokenCount, Turn, ViewType, WinCtx } from '@/ps/games/splendor/types';
import type { ActionResponse, BaseState, EndType, Player } from '@/ps/games/types';
import type { User } from 'ps-client';

export { meta } from '@/ps/games/splendor/meta';

export class Splendor extends BaseGame<State> {
	log: Log[] = [];
	declare winCtx?: WinCtx | { type: EndType };

	constructor(ctx: BaseContext) {
		super(ctx);
		super.persist(ctx);

		if (ctx.backup) return;

		const allCards = Object.values(metadata.pokemon);
		this.state.board = {
			tokens: Object.fromEntries(AllTokenTypes.map(tokenType => [tokenType, 0])) as TokenCount,
			cards: {
				'1': { wild: [], deck: allCards.filter(({ tier }) => tier === 1) },
				'2': { wild: [], deck: allCards.filter(({ tier }) => tier === 2) },
				'3': { wild: [], deck: allCards.filter(({ tier }) => tier === 3) },
			},
			trainers: [],
		};
		this.state.actionState = { action: VIEW_ACTION_TYPE.NONE };
		this.state.playerData = {};
	}

	createPlayerData(name: string, input: Partial<PlayerData> = {}): PlayerData {
		return {
			points: 0,
			tokens: Object.fromEntries(AllTokenTypes.map(type => [type, 0])) as TokenCount,
			cards: [],
			reserved: [],
			trainers: [],
			...input,
			id: toId(name),
			name,
		};
	}

	gameCanEnd(): boolean {
		const lastPlayerInRound = this.turns.findLast(turn => !this.players[turn].out);

		return (
			this.turn === lastPlayerInRound &&
			Object.values(this.players)
				.filter(player => !player.out)
				.some(player => this.state.playerData[player.turn].points >= POINTS_TO_WIN)
		);
	}

	onStart(): ActionResponse {
		const playerCount = Object.keys(this.players).length;

		// Set tokens. Tokens at the beginning are given by startCount. Base player count is 2.
		AllTokenTypes.forEach(tokenType => (this.state.board.tokens[tokenType] = metadata.types[tokenType].startCount[playerCount - 2]));
		// Set wild cards
		([1, 2, 3] as const).forEach(tier => {
			const TierCards = this.state.board.cards[tier];
			TierCards.deck.shuffle(this.prng);
			TierCards.wild = TierCards.deck.splice(0, 4);
		});
		// Set trainers
		this.state.board.trainers = Object.values(metadata.trainers).sample(playerCount + 1, this.prng);

		this.state.playerData = Object.fromEntries(
			Object.values(this.players).map(player => [player.id, this.createPlayerData(player.name)])
		);

		return { success: true, data: null };
	}

	onReplacePlayer(turn: BaseState['turn'], withPlayer: User): ActionResponse {
		const newData = this.createPlayerData(withPlayer.name, this.state.playerData[turn]);
		delete this.state.playerData[turn];
		this.state.playerData[withPlayer.id] = newData;
		return { success: true, data: null };
	}

	onRemovePlayer(player: Player): ActionResponse<'end' | null> {
		if (this.started) {
			this.state.playerData[player.turn].out = true;

			if (this.gameCanEnd()) return { success: true, data: 'end' };
			else {
				const playerData = this.state.playerData[player.turn];
				playerData.out = true;

				const playerCount = Object.values(this.players).filter(player => !player.out).length as 2 | 3 | 4;

				AllTokenTypes.forEach(tokenType => {
					const meta = metadata.types[tokenType].startCount;
					const reduceTokens = (meta[playerCount - 2] ?? 0) - (meta[playerCount - 2 - 1] ?? 0);
					this.state.board.tokens[tokenType] += playerData.tokens[tokenType] - reduceTokens;
					playerData.tokens[tokenType] = 0;
					if (this.state.board.tokens[tokenType] < 0) this.state.board.tokens[tokenType] = 0;
				});
			}
		}
		return { success: true, data: null };
	}

	lookupCard(ctx: string): Card | null {
		const id = toId(ctx);
		if (id === 'constructor') return null;
		return metadata.pokemon[id] ?? null;
	}

	findWildCard(ctx: string): ActionResponse<Card> {
		const card = this.lookupCard(ctx);
		if (!card) return { success: false, error: this.$T('GAME.SPLENDOR.INVALID_CARD', { card: ctx }) };
		const foundCard = Object.values(this.state.board.cards)
			.flatMap(cards => cards.wild)
			.find(wildCard => wildCard.id === card.id);

		if (!foundCard) return { success: false, error: this.$T('GAME.SPLENDOR.CARD_NOT_ACCESSIBLE', { card: card.name }) };
		return { success: true, data: foundCard };
	}

	receiveTokens(tokens: Partial<TokenCount>, playerData: PlayerData): void {
		const bank = this.state.board.tokens;
		(Object.entries(tokens) as [TOKEN_TYPE, number][]).forEach(([tokenType, count]) => {
			if (count > bank[tokenType]) {
				throw new Error(`Tried to receive ${count} ${metadata.types[tokenType].name} tokens (bank had ${bank[tokenType]})!`);
			}
			bank[tokenType] -= count;
			playerData.tokens[tokenType] += count;
		});
	}
	spendTokens(tokens: Partial<TokenCount>, playerData: PlayerData): void {
		const bank = this.state.board.tokens;
		(Object.entries(tokens) as [TOKEN_TYPE, number][]).forEach(([tokenType, count]) => {
			if (count > playerData.tokens[tokenType]) {
				throw new Error(`Tried to use ${count} ${metadata.types[tokenType].name} tokens (only had ${playerData.tokens[tokenType]})!`);
			}
			bank[tokenType] += count;
			playerData.tokens[tokenType] -= count;
		});
	}

	action(user: User, ctx: string): void {
		if (!this.started) this.throw('GAME.NOT_STARTED');
		if (user.id !== this.players[this.turn!].id) this.throw('GAME.IMPOSTOR_ALERT');
		const player = this.getPlayer(user)!;
		const playerData = this.state.playerData[player.turn];
		const [action, actionCtx] = ctx.lazySplit(' ', 1);

		if (this.state.actionState.action === VIEW_ACTION_TYPE.TOO_MANY_TOKENS && action !== VIEW_ACTION_TYPE.TOO_MANY_TOKENS)
			throw new ChatError(this.$T('GAME.SPLENDOR.DISCARD_TOKENS_REQUIRED'));

		let logEntry: Log;
		// VIEW_ACTION_TYPES update the user's state while staying on the same turn. Use 'return'.
		// The exception to this is TOO_MANY_TOKENS, which is deferred from ACTIONS and uses 'break'.
		// ACTIONS are actual actions, and will end the turn and stuff if valid. Use 'break'.
		switch (action) {
			case VIEW_ACTION_TYPE.CLICK_TOKENS: {
				this.state.actionState = { action: VIEW_ACTION_TYPE.CLICK_TOKENS };
				this.update(user.id);
				return;
			}
			case VIEW_ACTION_TYPE.CLICK_RESERVE: {
				const card = this.lookupCard(actionCtx);
				if (!card) throw new ChatError(this.$T('GAME.SPLENDOR.CARD_NOT_AVAILABLE_RESERVE', { card: actionCtx }));

				const canAfford = this.canAfford(card.cost, playerData.tokens, playerData.cards);

				this.state.actionState = {
					action: VIEW_ACTION_TYPE.CLICK_RESERVE,
					id: card.id,
					preset: canAfford ? canAfford.recommendation : null,
				};
				this.update(user.id);
				return;
			}
			case VIEW_ACTION_TYPE.CLICK_WILD: {
				const lookupCard = this.findWildCard(actionCtx);
				if (!lookupCard.success) throw new ChatError(this.$T('GAME.SPLENDOR.CARD_NOT_AVAILABLE_BUY', { card: actionCtx }));

				const card = lookupCard.data;

				const canBuy = this.canAfford(card.cost, playerData.tokens, playerData.cards);
				const canReserve = this.canReserve(player);

				if (!canBuy && !canReserve) throw new ChatError(this.$T('GAME.SPLENDOR.CANNOT_BUY_OR_RESERVE', { card: card.name }));
				this.state.actionState = {
					action: VIEW_ACTION_TYPE.CLICK_WILD,
					id: card.id,
					...(canBuy ? { canBuy: true, preset: canBuy.recommendation } : { canBuy: false, preset: null }),
					canReserve,
				};
				this.update(user.id);
				return;
			}
			case VIEW_ACTION_TYPE.CLICK_DECK: {
				if (!['1', '2', '3'].includes(actionCtx)) throw new ChatError(this.$T('GAME.SPLENDOR.WHICH_TIER'));
				const tier = +actionCtx as 1 | 2 | 3;
				if (this.state.board.cards[tier].deck.length === 0)
					throw new ChatError(this.$T('GAME.SPLENDOR.DECK_EMPTY', { tier }));

				const canReserve = this.canReserve(player);
				if (!canReserve) throw new ChatError(this.$T('GAME.SPLENDOR.RESERVE_LIMIT'));

				this.state.actionState = { action: VIEW_ACTION_TYPE.CLICK_DECK, tier };
				this.update(user.id);
				return;
			}

			case VIEW_ACTION_TYPE.TOO_MANY_TOKENS: {
				if (this.state.actionState.action !== VIEW_ACTION_TYPE.TOO_MANY_TOKENS)
					throw new ChatError(this.$T('GAME.SPLENDOR.NO_DISCARD_NEEDED'));
				const toDiscard = this.state.actionState.discard;
				const tokens = this.parseTokens(actionCtx, true);
				const discarding = Object.values(tokens).sum();

				if (discarding < toDiscard)
					throw new ChatError(this.$T('GAME.SPLENDOR.DISCARD_MORE', { required: toDiscard, discarding }));
				if (!this.canAfford(tokens, playerData.tokens, null, false))
					throw new ChatError(this.$T('GAME.SPLENDOR.CANNOT_DISCARD'));

				this.spendTokens(tokens, playerData);
				logEntry = { turn: player.turn, time: new Date(), action: VIEW_ACTION_TYPE.TOO_MANY_TOKENS, ctx: { discard: tokens } };
				break;
			}

			case ACTIONS.BUY: {
				const [mon, tokenInfo = ''] = actionCtx.lazySplit(' ', 1);
				const getCard = this.findWildCard(mon);
				if (!getCard.success) throw new ChatError(getCard.error);
				const card = getCard.data;

				const paying = this.parseTokens(tokenInfo, true);
				const canAfford = this.canAfford(card.cost, paying, playerData.cards);
				if (!canAfford) throw new ChatError(this.$T('GAME.SPLENDOR.INSUFFICIENT_TOKENS', { card: card.name }));

				if (Object.values(paying).sum() !== Object.values(canAfford.recommendation).sum())
					throw new ChatError(this.$T('GAME.SPLENDOR.OVERPAYING'));

				playerData.cards.push(card);

				const stage = this.state.board.cards[card.tier];
				stage.wild.remove(card);
				stage.wild.push(...stage.deck.splice(0, 1));

				this.spendTokens(paying, playerData);

				logEntry = { turn: player.turn, time: new Date(), action: ACTIONS.BUY, ctx: { id: card.id, cost: paying } };
				break;
			}

			case ACTIONS.RESERVE: {
				if (!this.canReserve(player)) {
					throw new ChatError(this.$T('GAME.SPLENDOR.CANNOT_RESERVE'));
				}

				const deckReserve = ['1', '2', '3'].includes(actionCtx) ? +actionCtx : null;
				let reservedId: string;
				if (deckReserve) {
					const tier = deckReserve as 1 | 2 | 3;
					if (this.state.board.cards[tier].deck.length === 0)
						throw new ChatError(this.$T('GAME.SPLENDOR.DECK_EMPTY', { tier }));

					const [card] = this.state.board.cards[tier].deck.splice(0, 1);
					playerData.reserved.push(card);

					reservedId = card.id;
				} else {
					const getCard = this.findWildCard(actionCtx);
					if (!getCard.success) throw new ChatError(getCard.error);

					const card = getCard.data;

					playerData.reserved.push(card);

					const stage = this.state.board.cards[card.tier];
					stage.wild.remove(card);
					stage.wild.push(...stage.deck.splice(0, 1));

					reservedId = card.id;
				}

				const willReceiveDragon = this.state.board.tokens[TOKEN_TYPE.DRAGON] > 0;
				if (willReceiveDragon) this.receiveTokens({ [TOKEN_TYPE.DRAGON]: 1 }, playerData);
				else this.room.privateSend(player.id, this.$T('GAME.SPLENDOR.NO_DRAGON_RECEIVED'));

				logEntry = {
					turn: player.turn,
					time: new Date(),
					action: ACTIONS.RESERVE,
					ctx: { id: reservedId, deck: deckReserve, gotDragon: willReceiveDragon },
				};
				break;
			}

			case ACTIONS.BUY_RESERVE: {
				const [mon, tokenInfo = ''] = actionCtx.lazySplit(' ', 1);
				const baseCard = this.lookupCard(mon);
				if (!baseCard) throw new ChatError(this.$T('GAME.SPLENDOR.INVALID_CARD', { card: mon }));
				const reservedCard = playerData.reserved.find(card => card.id === baseCard.id);
				if (!reservedCard) throw new ChatError(this.$T('GAME.SPLENDOR.NOT_RESERVED', { card: baseCard.name }));

				const paying = this.parseTokens(tokenInfo, true);
				if (!this.canAfford(reservedCard.cost, paying, playerData.cards))
					throw new ChatError(this.$T('GAME.SPLENDOR.INSUFFICIENT_TOKENS', { card: reservedCard.name }));

				this.spendTokens(paying, playerData);
				playerData.reserved.remove(reservedCard);
				playerData.cards.push(reservedCard);

				logEntry = { turn: player.turn, time: new Date(), action: ACTIONS.BUY_RESERVE, ctx: { id: reservedCard.id, cost: paying } };
				break;
			}

			case ACTIONS.DRAW: {
				const tokens = this.parseTokens(actionCtx);
				const validateTokens = this.getTokenIssues(tokens);
				if (!validateTokens.success) throw new ChatError(validateTokens.error);
				this.receiveTokens(tokens, playerData);

				logEntry = { turn: player.turn, time: new Date(), action: ACTIONS.DRAW, ctx: { tokens } };
				break;
			}

			case ACTIONS.PASS: {
				logEntry = { turn: player.turn, time: new Date(), action: ACTIONS.PASS, ctx: null };
				break;
			}

			default: {
				throw new ChatError(this.$T('GAME.SPLENDOR.UNRECOGNIZED_ACTION', { action, context: actionCtx }));
			}
		}

		// TODO: Add a UI for one-at-a-time
		const newTrainers = this.state.board.trainers.filter(trainer => this.canAfford(trainer.types, {}, playerData.cards));
		this.state.board.trainers.remove(...newTrainers);
		playerData.trainers.push(...newTrainers);
		if (logEntry.ctx) logEntry.ctx.trainers = newTrainers.map(trainer => trainer.id);
		this.chatLog(logEntry);

		playerData.points = playerData.cards.map(card => card.points).sum() + playerData.trainers.map(trainer => trainer.points).sum();

		this.state.actionState = { action: VIEW_ACTION_TYPE.NONE };

		if (this.gameCanEnd()) return this.end();
		else if (Object.values(playerData.tokens).sum() > MAX_TOKEN_COUNT) {
			const count = Object.values(playerData.tokens).sum();
			this.state.actionState = { action: VIEW_ACTION_TYPE.TOO_MANY_TOKENS, discard: count - MAX_TOKEN_COUNT };
			this.update(user.id);
			this.backup();
		} else this.endTurn();
	}

	canAfford(
		cost: Partial<TokenCount>,
		funds: Partial<TokenCount>,
		cards: Card[] | null,
		allowDragons = true
	): { recommendation: TokenCount } | false {
		const cardCounts = cards?.groupBy(card => card.type) ?? {};

		const spendingPower = Object.fromEntries(
			AllTokenTypes.map(type => [type, (funds[type] ?? 0) + (cardCounts[type]?.length ?? 0)])
		) as TokenCount;

		const availableDragons = spendingPower[TOKEN_TYPE.DRAGON] - (cost[TOKEN_TYPE.DRAGON] ?? 0);
		if (availableDragons < 0) return false;

		const neededDragons = TokenTypes.filterMap(type => {
			const needed = cost[type];
			if (needed && needed > spendingPower[type]) return needed - spendingPower[type];
		}).sum();

		if (neededDragons > availableDragons) return false;
		if (neededDragons > 0 && !allowDragons) return false;
		return {
			recommendation: {
				...Object.fromEntries(
					TokenTypes.map(type => [
						type,
						Math.min(cost[type] ? Math.max(cost[type] - (cardCounts[type]?.length ?? 0), 0) : 0, funds[type] ?? 0),
					])
				),
				[TOKEN_TYPE.DRAGON]: neededDragons,
			} as TokenCount,
		};
	}

	canReserve(player: Player): boolean {
		return this.state.playerData[player.turn].reserved.length < MAX_RESERVE_COUNT;
	}

	/**
	 * @example this.parseTokens('colorless 1'); // { colorless: 1... }
	 */
	parseTokens(input: string, allowDragon?: boolean): TokenCount {
		const tokens = Object.fromEntries(AllTokenTypes.map(type => [type, 0])) as TokenCount;
		input.split(/ /i).forEach(entry => {
			const type = entry.replace(/[^a-z]/gi, '').toLowerCase() as TOKEN_TYPE;
			const amt = +(entry.match(/\d/) ?? '0');
			if (!(amt >= 0 && amt < 10)) throw new ChatError(this.$T('GAME.SPLENDOR.INVALID_COUNT', { value: entry.substring(1) }));
			if (!AllTokenTypes.includes(type)) throw new ChatError(this.$T('GAME.SPLENDOR.UNRECOGNIZED_TYPE', { type }));
			if (type === TOKEN_TYPE.DRAGON && !allowDragon)
				throw new ChatError(this.$T('GAME.SPLENDOR.DRAGON_NOT_ALLOWED'));
			tokens[type] += amt;
		});
		return tokens;
	}

	getTokenIssues(tokens: TokenCount): ActionResponse {
		const input = (Object.entries(tokens) as [TOKEN_TYPE, number][]).filterMap(([type, count]) => {
			if (count > 0) return { type, count, available: this.state.board.tokens[type], name: metadata.types[type].name };
		});

		if (tokens[TOKEN_TYPE.DRAGON])
			return { success: false, error: this.$T('GAME.SPLENDOR.DRAGON_ONLY_BY_RESERVE') };

		const tooMany = input.filter(({ count, available }) => count > available);
		if (tooMany.length > 0) {
			const extraInfo = ` (${tooMany.map(({ count, available, name }) => `${count} from ${name} (${available})`).list(this.$T)})`;
			return {
				success: false,
				error: this.$T('GAME.SPLENDOR.TOO_MANY_TOKENS_TAKEN', { info: extraInfo }),
			};
		}

		if (input.length > 3) return { success: false, error: this.$T('GAME.SPLENDOR.TOO_MANY_TOKENS') };
		if (input.length === 0) return { success: false, error: this.$T('GAME.SPLENDOR.TAKE_AT_LEAST_TWO') };
		if (input.length < 3 && input.every(({ count }) => count === 1)) {
			// Support people taking one-of-a-kind for _less_ than 3
			// Mainly matters when either the bank doesn't have enough types or the player can't take 3 more
			const typesInBank = TokenTypes.filter(tokenType => this.state.board.tokens[tokenType] > 0);
			const playerTokens = Object.values(this.state.playerData[this.turn!].tokens).sum();
			if (!(typesInBank.length < 3 || playerTokens + 3 > MAX_TOKEN_COUNT))
				return { success: false, error: this.$T('GAME.SPLENDOR.TAKE_THREE_TYPES') };
			return { success: true, data: null };
		}
		if (input.length === 2) {
			return { success: false, error: this.$T('GAME.SPLENDOR.TAKE_RULES') };
		}

		if (input.length === 1) {
			const { count, name, available } = input[0];
			if (count !== 2) return { success: false, error: this.$T('GAME.SPLENDOR.TAKE_EXACTLY_TWO') };
			if (available < 4)
				return {
					success: false,
					error: this.$T('GAME.SPLENDOR.STACK_TOO_SMALL', { name, available }),
				};
		}

		if (input.length === 3) {
			const moreThanOne = input.filter(({ count }) => count !== 1);
			if (moreThanOne.length > 0) {
				const extraInfo = ` Tried to take ${moreThanOne.map(({ count, name }) => `${count} from ${name}`).list(this.$T)}`;
				return {
					success: false,
					error: this.$T('GAME.SPLENDOR.ONE_EACH_TYPE', { info: extraInfo }),
				};
			}
		}

		return { success: true, data: null };
	}

	onEnd(type?: EndType): TranslatedText {
		if (type) {
			this.winCtx = { type };
			if (type === 'dq') return this.$T('GAME.ENDED_AUTOMATICALLY', { game: this.meta.name, id: this.id });
			return this.$T('GAME.ENDED', { game: this.meta.name, id: this.id });
		}
		const sorted = Object.values(this.state.playerData).sort((p1, p2) => {
			if (p1.points !== p2.points) return p2.points - p1.points;
			if (p1.cards.length !== p2.cards.length) return p1.cards.length - p2.cards.length;
			return [-1, 1].random(this.prng)!;
		});

		const winner = sorted[0];
		this.winCtx = { type: 'win', winner };
		return this.$T('GAME.WON', { winner: winner.name });
	}

	chatLog(log: Log): void {
		this.log.push(log);
		this.room.sendHTML(...renderLog(log, this));
	}

	render(side: Turn | null) {
		let view: ViewType;
		if (side) {
			if (side === this.turn) view = { type: 'player', active: true, self: side, ...this.state.actionState };
			else view = { type: 'player', active: false, self: side };
		} else view = { type: 'spectator', active: false, action: this.winCtx ? VIEW_ACTION_TYPE.GAME_END : null };

		const ctx: RenderCtx = { id: this.id, board: this.state.board, players: this.state.playerData, turns: this.turns, view, $T: this.$T };

		if (this.winCtx) {
			ctx.header = this.$T('GAME.GAME_ENDED');
		} else if (side === this.turn) {
			ctx.header = this.$T('GAME.YOUR_TURN');
		} else if (side) {
			ctx.header = this.$T('GAME.WAITING_FOR_PLAYER', { player: this.players[this.turn!]?.name });
			ctx.dimHeader = true;
		} else if (this.turn) {
			const current = this.players[this.turn];
			ctx.header = this.$T('GAME.WAITING_FOR_PLAYER', { player: `${current.name}${this.sides ? ` (${this.turn})` : ''}` });
		}
		return render.bind(this.renderCtx)(ctx);
	}
}
