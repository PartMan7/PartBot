type PieceDef = {
	cells: [number, number][];
	ref: [number, number];
	size: number;
	orientations: [number, number][][];
};

export type PieceId =
	| '1'
	| '2'
	| '3'
	| '4'
	| '5'
	| '6'
	| '7'
	| '8'
	| '9'
	| '10'
	| '11'
	| '12'
	| '13'
	| '14'
	| '15'
	| '16'
	| '17'
	| '18'
	| '19'
	| '20'
	| '21';

const PIECE_DEFS: Record<PieceId, Omit<PieceDef, 'orientations'>> = {
	// Monomino
	'1': { cells: [[0, 0]], ref: [0, 0], size: 1 },
	// Domino
	'2': {
		cells: [
			[0, 0],
			[1, 0],
		],
		ref: [0, 0],
		size: 2,
	},
	// Straight triomino
	'3': {
		cells: [
			[0, 0],
			[1, 0],
			[2, 0],
		],
		ref: [1, 0],
		size: 3,
	},
	// V triomino
	'4': {
		cells: [
			[0, 0],
			[0, 1],
			[1, 0],
		],
		ref: [1, 0],
		size: 3,
	},
	// I tetromino
	'5': {
		cells: [
			[0, 0],
			[1, 0],
			[2, 0],
			[3, 0],
		],
		ref: [1, 0],
		size: 4,
	},
	// O tetromino
	'6': {
		cells: [
			[0, 0],
			[1, 0],
			[0, 1],
			[1, 1],
		],
		ref: [0, 0],
		size: 4,
	},
	// L tetromino
	'7': {
		cells: [
			[0, 0],
			[0, 1],
			[0, 2],
			[1, 2],
		],
		ref: [0, 1],
		size: 4,
	},
	// T tetromino
	'8': {
		cells: [
			[0, 0],
			[1, 0],
			[2, 0],
			[1, 1],
		],
		ref: [1, 0],
		size: 4,
	},
	// S tetromino
	'9': {
		cells: [
			[0, 0],
			[1, 0],
			[1, 1],
			[2, 1],
		],
		ref: [1, 1],
		size: 4,
	},
	// X
	'10': {
		cells: [
			[1, 0],
			[0, 1],
			[1, 1],
			[2, 1],
			[1, 2],
		],
		ref: [1, 1],
		size: 5,
	},
	// I
	'11': {
		cells: [
			[0, 0],
			[1, 0],
			[2, 0],
			[3, 0],
			[4, 0],
		],
		ref: [2, 0],
		size: 5,
	},
	// L
	'12': {
		cells: [
			[0, 0],
			[0, 1],
			[0, 2],
			[0, 3],
			[1, 3],
		],
		ref: [0, 2],
		size: 5,
	},
	// Z
	'13': {
		cells: [
			[0, 0],
			[1, 1],
			[1, 0],
			[1, 2],
			[2, 2],
		],
		ref: [1, 1],
		size: 5,
	},
	// P
	'14': {
		cells: [
			[0, 0],
			[1, 0],
			[0, 1],
			[1, 1],
			[0, 2],
		],
		ref: [0, 1],
		size: 5,
	},
	// T
	'15': {
		cells: [
			[0, 0],
			[1, 0],
			[2, 0],
			[1, 1],
			[1, 2],
		],
		ref: [1, 1],
		size: 5,
	},
	// U
	'16': {
		cells: [
			[0, 0],
			[2, 0],
			[0, 1],
			[1, 1],
			[2, 1],
		],
		ref: [1, 1],
		size: 5,
	},
	// V
	'17': {
		cells: [
			[0, 0],
			[0, 1],
			[0, 2],
			[1, 2],
			[2, 2],
		],
		ref: [0, 2],
		size: 5,
	},
	// W
	'18': {
		cells: [
			[0, 0],
			[1, 0],
			[1, 1],
			[2, 1],
			[2, 2],
		],
		ref: [1, 1],
		size: 5,
	},
	// Y
	'19': {
		cells: [
			[0, 0],
			[1, 0],
			[2, 0],
			[3, 0],
			[1, 1],
		],
		ref: [1, 0],
		size: 5,
	},
	// N
	'20': {
		cells: [
			[0, 0],
			[1, 0],
			[2, 0],
			[2, 1],
			[3, 1],
		],
		ref: [1, 0],
		size: 5,
	},
	// F
	'21': {
		cells: [
			[1, 0],
			[1, 1],
			[2, 1],
			[0, 2],
			[1, 2],
		],
		ref: [1, 1],
		size: 5,
	},
};

function rotate90(cells: [number, number][]): [number, number][] {
	return cells.map(([x, y]) => [y, -x]);
}

function rotatePoint([x, y]: [number, number]): [number, number] {
	return [y, -x];
}

function flipH(cells: [number, number][]): [number, number][] {
	return cells.map(([x, y]) => [-x, y]);
}

function buildOrientations(cells: [number, number][], ref: [number, number]): [number, number][][] {
	const results: [number, number][][] = [];
	const seen = new Set<string>();
	const baseCells = cells.map(([x, y]) => [x, y] as [number, number]);
	const baseRef: [number, number] = [ref[0], ref[1]];
	let currentCells = baseCells;
	let currentRef = baseRef;

	for (let flip = 0; flip < 2; flip++) {
		for (let rot = 0; rot < 4; rot++) {
			const [rx, ry] = currentRef;
			const minX = Math.min(...currentCells.map(([x]) => x));
			const minY = Math.min(...currentCells.map(([, y]) => y));
			const relative = currentCells.map(([x, y]) => [x - rx, y - ry] as [number, number]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
			const key = currentCells
				.map(([x, y]) => [x - minX, y - minY])
				.sort((a, b) => a[0] - b[0] || a[1] - b[1])
				.map(c => c.join(','))
				.join('|');
			if (!seen.has(key)) {
				seen.add(key);
				results.push(relative);
			}
			currentCells = rotate90(currentCells);
			currentRef = rotatePoint(currentRef);
		}
		currentCells = flipH(baseCells);
		currentRef = flipH([baseRef])[0];
	}
	return results;
}

/** `ref` is a fixed tile on the piece; orientations are offsets from that tile (ref → [0,0]). */
export const PIECES: Record<PieceId, PieceDef> = Object.fromEntries(
	Object.entries(PIECE_DEFS).map(([id, def]) => [id, { ...def, orientations: buildOrientations(def.cells, def.ref) }])
) as Record<PieceId, PieceDef>;

export const ALL_PIECE_IDS = Object.keys(PIECES) as PieceId[];

export const PLAYER_COLORS = ['#1e88e5', '#fdd835', '#e53935', '#43a047'] as const;

export const CORNERS: [number, number][] = [
	[0, 0],
	[0, -1],
	[-1, -1],
	[-1, 0],
];

export const BOARD_SIZE = { two: 14, many: 20 } as const;
