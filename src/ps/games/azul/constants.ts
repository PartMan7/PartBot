import type { Hex } from '@/utils/color';

export enum Tile {
	Water = 'water',
	Electric = 'electric',
	Fire = 'fire',
	Grass = 'grass',
	Dark = 'dark',
}

export const TILES = [Tile.Water, Tile.Electric, Tile.Fire, Tile.Grass, Tile.Dark] as const;

export const TILE_COLORS: Record<Tile, Hex> = {
	[Tile.Water]: '#1e88e5' as Hex,
	[Tile.Electric]: '#fdd835' as Hex,
	[Tile.Fire]: '#e53935' as Hex,
	[Tile.Grass]: '#00a900' as Hex,
	[Tile.Dark]: '#37474f' as Hex,
};

export const TILE_LABELS: Record<Tile, string> = {
	[Tile.Water]: 'Water',
	[Tile.Electric]: 'Electric',
	[Tile.Fire]: 'Fire',
	[Tile.Grass]: 'Grass',
	[Tile.Dark]: 'Dark',
};

/** We reuse Splendor assets */
export const TILE_ART: Record<Tile, string> = {
	[Tile.Water]: 'water.png',
	[Tile.Electric]: 'electric.png',
	[Tile.Fire]: 'fire.png',
	[Tile.Grass]: 'grass.png',
	[Tile.Dark]: 'dark.png',
};

export const TILES_PER_COLOR = 20;
export const FACTORY_COUNT: Record<2 | 3 | 4, number> = { 2: 5, 3: 7, 4: 9 };
export const TILES_PER_FACTORY = 4;

/**
 * 3x3 cell indices (row-major 0-8) hosting factories, in factory order.
 * indices:  0 1 2
 *           3 4 5
 *           6 7 8
 */
export const FACTORY_LAYOUT: Record<number, number[]> = {
	5: [1, 3, 4, 5, 7],
	7: [0, 1, 2, 3, 5, 6, 8],
	9: [0, 1, 2, 3, 4, 5, 6, 7, 8],
};

/** Standard wall type at [row][col] */
export const WALL_PATTERN: Tile[][] = [
	[Tile.Water, Tile.Electric, Tile.Fire, Tile.Dark, Tile.Grass],
	[Tile.Grass, Tile.Water, Tile.Electric, Tile.Fire, Tile.Dark],
	[Tile.Dark, Tile.Grass, Tile.Water, Tile.Electric, Tile.Fire],
	[Tile.Fire, Tile.Dark, Tile.Grass, Tile.Water, Tile.Electric],
	[Tile.Electric, Tile.Fire, Tile.Dark, Tile.Grass, Tile.Water],
];

export const PATTERN_LENGTHS = [1, 2, 3, 4, 5] as const;

export const FLOOR_SIZE = 7;
export const FLOOR_PENALTIES = [-1, -1, -2, -2, -2, -3, -3] as const;

export const BONUS_ROW = 2;
export const BONUS_COL = 7;
export const BONUS_COLOR = 10;

export enum AzulMods {
	FREE_GRID = 'freegrid',
}

export enum VIEW_ACTION_TYPE {
	NONE = 'none',
	CLICK_FACTORY = 'factory',
	CLICK_CENTER = 'center',
	PLACE = 'place',
	GAME_END = 'end',
}

export enum ACTIONS {
	TAKE = 'take',
	PLACE = 'place',
}

export enum POST_TURN_ACTIONS {
	WALL = 'wall',
}
