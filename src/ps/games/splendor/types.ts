import type { TranslationFn } from '@/i18n/types';
import type { TOKEN_TYPE, VIEW_ACTION_TYPE } from '@/ps/games/splendor/constants';

export type Turn = string;

export type TokenCount = Record<TOKEN_TYPE, number>;

export type Metadata = {
	pokemon: Record<string, Card>;
	trainers: Record<string, Trainer>;
	types: Record<string, { id: TOKEN_TYPE; name: string; art: string; startCount: [number, number, number] }>;
	artists: Record<string, { id: string; name: string; url: string | null }>;
};

export type Card = {
	id: string;
	name: string;
	tier: 1 | 2 | 3;
	type: TOKEN_TYPE;
	points: number;
	cost: Partial<TokenCount>;
	art: string;
	attr?: string;
};

export type Deck = Card[];
export type WildCards = Card[];

export type Trainer = {
	id: string;
	name: string;
	points: number;
	types: Partial<TokenCount>;
	art: string;
};

export type Board = {
	cards: Record<1 | 2 | 3, { wild: WildCards; deck: Deck }>;
	trainers: Trainer[];
	tokens: TokenCount;
};

export type PlayerData = {
	id: string;
	name: string;
	points: number;
	tokens: TokenCount;
	cards: Card[];
	reserved: Card[];
	trainers: Trainer[];
	out?: boolean;
};

type ActivePlayer = {
	type: 'player';
	active: true;
	self: string;
};

export type ActionState =
	| { action: VIEW_ACTION_TYPE.NONE }
	| { action: VIEW_ACTION_TYPE.CLICK_TOKENS }
	| ({ action: VIEW_ACTION_TYPE.CLICK_WILD; id: string; canReserve: boolean } & (
			| { canBuy: true; preset: TokenCount }
			| { canBuy: false; preset: null }
	  ))
	| { action: VIEW_ACTION_TYPE.CLICK_DECK; tier: 1 | 2 | 3 }
	| { action: VIEW_ACTION_TYPE.CLICK_RESERVE; id: string; preset: TokenCount | null }
	| { action: VIEW_ACTION_TYPE.TOO_MANY_TOKENS; discard: number };

export type ViewType =
	| {
			type: 'spectator';
			active: false;
			action: VIEW_ACTION_TYPE.GAME_END | null;
	  }
	| {
			type: 'player';
			active: false;
			self: string;
	  }
	| (ActivePlayer & ActionState);

export type State = {
	pointsToWin: number;
	turn: Turn;
	board: Board;
	playerData: Record<Turn, PlayerData>;
	actionState: ActionState;
};

export type RenderCtx = {
	id: string;
	board: Board;
	header?: string;
	dimHeader?: boolean;
	view: ViewType;
	turns: string[];
	players: Record<string, PlayerData>;
	$T: TranslationFn;
};

export type WinCtx = { type: 'win'; winner: { name: string; id: string; points: number } } | { type: 'draw' };
