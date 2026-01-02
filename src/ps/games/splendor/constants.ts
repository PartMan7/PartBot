export enum TOKEN_TYPE {
	COLORLESS = 'colorless',
	DARK = 'dark',
	FIRE = 'fire',
	GRASS = 'grass',
	WATER = 'water',
	DRAGON = 'dragon',
}

export const TokenTypes = [TOKEN_TYPE.COLORLESS, TOKEN_TYPE.DARK, TOKEN_TYPE.FIRE, TOKEN_TYPE.GRASS, TOKEN_TYPE.WATER];
export const AllTokenTypes = [...TokenTypes, TOKEN_TYPE.DRAGON];

export enum ACTIONS {
	BUY = 'buy',
	BUY_RESERVE = 'buy-reserve',
	RESERVE = 'reserve',
	DRAW = 'draw',
	PASS = 'pass',
}

export enum VIEW_ACTION_TYPE {
	NONE = 'none',
	CLICK_WILD = 'wild',
	CLICK_DECK = 'deck',
	CLICK_RESERVE = 'payback',
	CLICK_TOKENS = 'tokens',
	TOO_MANY_TOKENS = 'discard',
	GAME_END = 'end',
}

export const MIN_POINTS_TO_WIN = 8;
export const MAX_POINTS_TO_WIN = 21;
export const DEFAULT_POINTS_TO_WIN = 15;
export const MAX_TOKEN_COUNT = 10;
export const MAX_RESERVE_COUNT = 3;
