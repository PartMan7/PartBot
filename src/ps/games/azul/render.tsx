import {
	ACTIONS,
	FACTORY_LAYOUT,
	FLOOR_PENALTIES,
	FLOOR_SIZE,
	PATTERN_LENGTHS,
	POST_TURN_ACTIONS,
	TILES,
	TILE_ART,
	TILE_COLORS,
	TILE_LABELS,
	VIEW_ACTION_TYPE,
	WALL_PATTERN,
} from '@/ps/games/azul/constants';
import { LogEntry } from '@/ps/games/render';
import { Username } from '@/utils/components';
import { Button } from '@/utils/components/ps';
import { pluralize } from '@/utils/pluralize';

import type { TranslationFn } from '@/i18n/types';
import type { Tile } from '@/ps/games/azul/constants';
import type { Azul } from '@/ps/games/azul/index';
import type { Log } from '@/ps/games/azul/logs';
import type { Factory, FloorTile, PlayerBoard, RenderCtx, TilePile, ViewType } from '@/ps/games/azul/types';
import type { CSSProperties, ReactElement } from 'react';

type This = { msg: string };

const FACTORY_SIZE = 96;
const TILE_SIZE = 22;
const CELL = TILE_SIZE + 4;

/** Short hex tokens (UI-neutral greys) */
const S = '#8883';
const SS = '#8885';
const B = '#8888';
const M = '#8884';

const ART_BASE = `${process.env.WEB_URL}/static/splendor/type/`;
const FILL: Record<Tile, string> = Object.fromEntries(
	TILES.map(tile => [tile, `url(${ART_BASE}${TILE_ART[tile]}) center/95% no-repeat ${TILE_COLORS[tile]}`])
) as Record<Tile, string>;

const BTN: CSSProperties = { cursor: 'pointer', border: 0, padding: 0, background: 'none', color: 'inherit' };
const CELL_TD: CSSProperties = { width: CELL, height: CELL, padding: 0, textAlign: 'center', verticalAlign: 'middle' };

function TileChip({
	tile,
	size = TILE_SIZE,
	style,
}: {
	tile: Tile | 'first' | 'empty';
	size?: number;
	style?: CSSProperties;
}): ReactElement {
	if (tile === 'first') {
		return (
			<div
				style={{
					display: 'inline-block',
					width: size,
					height: size,
					background: '#fff',
					border: '1px solid #0007',
					borderRadius: 6,
					color: '#04a',
					fontWeight: 'bold',
					fontSize: Math.max(11, (size * 0.7) | 0),
					lineHeight: `${size - 2}px`,
					textAlign: 'center',
					verticalAlign: 'middle',
					...style,
				}}
			>
				-1
			</div>
		);
	}
	if (tile === 'empty') {
		return (
			<div
				style={{
					display: 'inline-block',
					width: size,
					height: size,
					border: `1px solid ${B}`,
					borderRadius: 4,
					verticalAlign: 'middle',
					...style,
				}}
			/>
		);
	}
	return (
		<div
			style={{
				display: 'inline-block',
				width: size,
				height: size,
				background: FILL[tile],
				border: '1px solid #fff9',
				borderRadius: 6,
				verticalAlign: 'middle',
				...style,
			}}
		/>
	);
}

export function renderLog(logEntry: Log, game: Azul): ReactElement {
	const playerName = game.players[logEntry.turn]?.name;
	const $T = game.$T;

	switch (logEntry.action) {
		case ACTIONS.PLACE: {
			const where =
				logEntry.ctx.row === 'floor' ? $T('GAME.AZUL.LOG.ON_PENALTIES') : $T('GAME.AZUL.LOG.ON_ROW', { row: logEntry.ctx.row + 1 });
			return (
				<LogEntry>
					<Username name={playerName} clickable /> {$T('GAME.AZUL.LOG.PLACED', { count: logEntry.ctx.count })}{' '}
					<TileChip tile={logEntry.ctx.color} size={16} /> {where}
					{logEntry.ctx.overflow > 0 && logEntry.ctx.row !== 'floor'
						? $T('GAME.AZUL.LOG.OVERFLOW', { count: logEntry.ctx.overflow })
						: ''}
					.
				</LogEntry>
			);
		}
		case POST_TURN_ACTIONS.WALL: {
			const byPlayer = logEntry.ctx.tiles.groupBy(tile => tile.turn);
			return (
				<LogEntry>
					{Object.entries(byPlayer).map(([turn, tiles], i) => (
						<>
							{i > 0 ? ' ' : null}
							<Username name={game.players[turn]?.name} clickable /> {$T('GAME.AZUL.LOG.TILED')}{' '}
							{tiles!.map((tile, j) => (
								<>
									{j > 0 ? ', ' : null}
									<TileChip tile={tile.color} size={16} />
								</>
							))}{' '}
							{$T('GAME.AZUL.LOG.FOR_POINTS', {
								points: pluralize(tiles!.map(tile => tile.points).sum(), $T('GAME.AZUL.LOG.POINT'), $T('GAME.AZUL.LOG.POINTS')),
							})}
						</>
					))}
				</LogEntry>
			);
		}
		default:
			return (
				<LogEntry>
					<Username name={playerName} clickable /> {$T('GAME.AZUL.LOG.SKIPPED')}
				</LogEntry>
			);
	}
}

function TileCountList({
	pile,
	first,
	onClick,
	source,
	selected,
	size = 18,
}: {
	pile: TilePile;
	first?: boolean;
	onClick?: string;
	source?: string;
	selected?: Tile | false | null;
	size?: number;
}): ReactElement {
	const entries = TILES.filterMap(tile => {
		const n = pile[tile] ?? 0;
		if (n > 0) return { tile, n };
	});
	return (
		<table style={{ borderCollapse: 'collapse', margin: '0 auto' }}>
			<tbody>
				{entries.map(({ tile, n }) => {
					const dimmed = selected === false || !!(selected && selected !== tile);
					const row = (
						<>
							<TileChip
								tile={tile}
								size={size}
								style={{
									opacity: dimmed ? 0.4 : 1,
									outline: selected && selected === tile ? `2px solid ${B}` : undefined,
								}}
							/>
							<span style={{ marginLeft: 4, fontWeight: 'bold', fontSize: 11, opacity: dimmed ? 0.4 : 0.85 }}>x{n}</span>
						</>
					);
					return (
						<tr>
							<td style={{ padding: '1px 2px' }}>
								{onClick && source !== undefined ? (
									<Button value={`${onClick} ! ${ACTIONS.TAKE} ${source} ${tile}`} style={BTN} title={TILE_LABELS[tile]}>
										{row}
									</Button>
								) : (
									row
								)}
							</td>
						</tr>
					);
				})}
				{first ? (
					<tr>
						<td style={{ padding: '1px 2px' }}>
							<TileChip tile="first" size={size} style={{ opacity: selected === false ? 0.4 : 1 }} />
						</td>
					</tr>
				) : null}
				{!entries.length && !first ? (
					<tr>
						<td style={{ opacity: 0.55, fontSize: 12 }}>empty</td>
					</tr>
				) : null}
			</tbody>
		</table>
	);
}

function FactoryDisplay({
	factory,
	onClick,
	source,
	selected,
}: {
	factory: Factory;
	onClick?: string;
	source?: string;
	selected?: Tile | false | null;
}): ReactElement {
	const chips: (Tile | null)[] = [...factory];
	while (chips.length < 4) chips.push(null);

	const cell = (tile: Tile | null): ReactElement => {
		if (!tile) return <td style={{ width: '50%', height: '50%' }} />;
		const dimmed = selected === false || !!(selected && selected !== tile);
		const chip = (
			<TileChip
				tile={tile}
				size={28}
				style={{
					opacity: dimmed ? 0.4 : 1,
					outline: selected && selected === tile ? `2px solid ${B}` : undefined,
				}}
			/>
		);
		return (
			<td style={{ width: '50%', height: '50%', textAlign: 'center' }}>
				{onClick && source !== undefined ? (
					<Button value={`${onClick} ! ${ACTIONS.TAKE} ${source} ${tile}`} style={BTN} title={TILE_LABELS[tile]}>
						{chip}
					</Button>
				) : (
					chip
				)}
			</td>
		);
	};

	return (
		<div style={{ width: FACTORY_SIZE, height: FACTORY_SIZE, background: SS, border: `2px solid ${B}`, borderRadius: 12, padding: 6 }}>
			<table style={{ width: '100%', height: '100%', borderCollapse: 'collapse' }}>
				<tbody>
					<tr>
						{cell(chips[0])}
						{cell(chips[1])}
					</tr>
					<tr>
						{cell(chips[2])}
						{cell(chips[3])}
					</tr>
				</tbody>
			</table>
		</div>
	);
}

function canPlaceOnRow(pattern: (Tile | null)[][], wall: (Tile | null)[][], row: number, color: Tile, freeGrid: boolean): boolean {
	const line = pattern[row];
	if (line.every(t => t !== null)) return false;
	const existing = line.find(t => t !== null);
	if (existing && existing !== color) return false;
	if (wall[row].some(cell => cell === color)) return false;
	if (freeGrid) {
		const hasLegalCol = [0, 1, 2, 3, 4].some(col => wall[row][col] === null && !wall.some(wallRow => wallRow[col] === color));
		if (!hasLegalCol) return false;
	}
	return true;
}

function WallMenu({
	player,
	row,
	color,
	onClick,
	$T,
}: {
	player: PlayerBoard;
	row: number;
	color: Tile;
	onClick: string;
	$T: TranslationFn;
}): ReactElement {
	const cols = [0, 1, 2, 3, 4].filter(col => player.wall[row][col] === null && !player.wall.some(wallRow => wallRow[col] === color));
	return (
		<div style={{ borderRadius: 12, padding: 8, background: M, margin: '8px auto', display: 'inline-block' }}>
			<div style={{ marginBottom: 6 }}>
				{$T('GAME.AZUL.CHOOSE_WALL_COLUMN_UI')} <TileChip tile={color} />
			</div>
			{cols.map(col => (
				<Button value={`${onClick} ! ${POST_TURN_ACTIONS.WALL} ${col}`} style={{ cursor: 'pointer', margin: 2 }}>
					{$T('GAME.AZUL.LABELS.COLUMN', { col: col + 1 })}
				</Button>
			))}
		</div>
	);
}

function BoardRows({
	pattern,
	wall,
	freeGrid,
	place,
}: {
	pattern: (Tile | null)[][];
	wall: (Tile | null)[][];
	freeGrid: boolean;
	place?: { color: Tile; onClick: string };
}): ReactElement {
	const row = (line: (Tile | null)[], i: number): ReactElement => (
		<tr>
			{Array.from({ length: 5 - line.length }).map(() => (
				<td style={CELL_TD} />
			))}
			{line.map(tile => (
				<td style={CELL_TD}>
					<TileChip tile={tile ?? 'empty'} size={TILE_SIZE} />
				</td>
			))}
			<td style={{ width: 10, height: CELL, padding: 0 }} />
			{wall[i].map((filled, j) => {
				const hint = freeGrid ? null : WALL_PATTERN[i][j];
				if (filled) {
					return (
						<td style={{ ...CELL_TD, border: `1px solid ${B}`, background: `${TILE_COLORS[filled]}55` }}>
							<TileChip tile={filled} size={TILE_SIZE} />
						</td>
					);
				}
				return (
					<td
						style={{
							...CELL_TD,
							border: `1px solid ${B}`,
							background: hint ? `${TILE_COLORS[hint]}28` : undefined,
						}}
					/>
				);
			})}
		</tr>
	);

	const table = (
		<table style={{ borderCollapse: 'collapse' }}>
			<tbody>{pattern.map((line, i) => row(line, i))}</tbody>
		</table>
	);

	if (!place) return <div style={{ display: 'inline-block' }}>{table}</div>;

	return (
		<div style={{ display: 'inline-block' }}>
			{pattern.map((line, i) => {
				const clickable = canPlaceOnRow(pattern, wall, i, place.color, freeGrid);
				const rowTable = (
					<table style={{ borderCollapse: 'collapse' }}>
						<tbody>{row(line, i)}</tbody>
					</table>
				);
				if (clickable) {
					return (
						<Button
							value={`${place.onClick} ! ${ACTIONS.PLACE} ${i}`}
							style={{
								cursor: 'pointer',
								display: 'block',
								padding: 2,
								margin: '1px 0',
								border: `1px solid ${B}`,
								borderRadius: 4,
								background: M,
							}}
						>
							{rowTable}
						</Button>
					);
				}
				return <div style={{ margin: '1px 0' }}>{rowTable}</div>;
			})}
		</div>
	);
}

function FloorLine({ floor, placeOnClick, $T }: { floor: FloorTile[]; placeOnClick?: string; $T: TranslationFn }): ReactElement {
	const size = 18;
	const cell = size + 4;
	const content = (
		<table style={{ borderCollapse: 'collapse', display: 'inline-table' }}>
			<tbody>
				<tr>
					{Array.from({ length: FLOOR_SIZE }).map((_, i) => (
						<td style={{ width: cell, height: cell, padding: 0, textAlign: 'center' }}>
							{floor[i] ? (
								<TileChip tile={floor[i]} size={size} />
							) : (
								<div style={{ display: 'inline-block', width: size, height: size, border: `1px solid ${B}`, borderRadius: 4 }} />
							)}
						</td>
					))}
				</tr>
				<tr>
					{Array.from({ length: FLOOR_SIZE }).map((_, i) => (
						<td style={{ padding: '1px 0 0', textAlign: 'center', fontSize: 10, fontWeight: 'bold', opacity: floor[i] ? 0.95 : 0.35 }}>
							{FLOOR_PENALTIES[i]}
						</td>
					))}
				</tr>
			</tbody>
		</table>
	);
	return (
		<div style={{ marginTop: 8 }}>
			<span style={{ fontSize: 12, opacity: 0.65, marginRight: 6 }}>{$T('GAME.AZUL.LABELS.PENALTIES')}</span>
			{placeOnClick ? (
				<Button
					value={`${placeOnClick} ! ${ACTIONS.PLACE} floor`}
					style={{ cursor: 'pointer', padding: 2, border: `1px solid ${B}`, borderRadius: 4, background: M }}
				>
					{content}
				</Button>
			) : (
				content
			)}
		</div>
	);
}

function PlayerBoardView({
	data,
	freeGrid,
	compact,
	place,
	$T,
}: {
	data: PlayerBoard;
	freeGrid: boolean;
	compact?: boolean;
	place?: { color: Tile; count: number; onClick: string };
	$T: TranslationFn;
}): ReactElement {
	const willOverflow =
		!!place &&
		PATTERN_LENGTHS.some(
			(_, row) =>
				canPlaceOnRow(data.pattern, data.wall, row, place.color, freeGrid) &&
				place.count > data.pattern[row].filter(t => t === null).length
		);

	return (
		<div
			style={{
				display: 'inline-block',
				verticalAlign: 'top',
				margin: 8,
				padding: compact ? 8 : '8px 20px',
				background: S,
				border: `1px solid ${B}`,
				borderRadius: 8,
				zoom: compact ? '70%' : undefined,
			}}
		>
			<div style={{ marginBottom: 6 }}>
				<Username name={data.name} clickable /> - <b>{data.score}</b>
			</div>
			{place ? (
				<div style={{ marginBottom: 6, fontSize: 12 }}>
					{place.count}x <TileChip tile={place.color} size={18} />
					{willOverflow ? <div style={{ marginTop: 4, opacity: 0.85 }}>{$T('GAME.AZUL.EXTRA_TO_PENALTIES')}</div> : null}
				</div>
			) : null}
			<BoardRows
				pattern={data.pattern}
				wall={data.wall}
				freeGrid={freeGrid}
				{...(place ? { place: { color: place.color, onClick: place.onClick } } : {})}
			/>
			<FloorLine floor={data.floor} $T={$T} {...(place ? { placeOnClick: place.onClick } : {})} />
		</div>
	);
}

function PlayerWallView({ data, freeGrid }: { data: PlayerBoard; freeGrid: boolean }): ReactElement {
	return (
		<div
			style={{
				display: 'inline-block',
				verticalAlign: 'top',
				margin: 8,
				padding: 8,
				background: S,
				border: `1px solid ${B}`,
				borderRadius: 8,
			}}
		>
			<div style={{ marginBottom: 6 }}>
				<Username name={data.name} clickable /> - <b>{data.score}</b>
			</div>
			<table style={{ borderCollapse: 'collapse' }}>
				<tbody>
					{data.wall.map((row, i) => (
						<tr>
							{row.map((filled, j) => {
								const hint = freeGrid ? null : WALL_PATTERN[i][j];
								if (filled) {
									return (
										<td style={{ ...CELL_TD, border: `1px solid ${B}`, background: `${TILE_COLORS[filled]}55` }}>
											<TileChip tile={filled} size={TILE_SIZE} />
										</td>
									);
								}
								return (
									<td
										style={{
											...CELL_TD,
											border: `1px solid ${B}`,
											background: hint ? `${TILE_COLORS[hint]}28` : undefined,
										}}
									/>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function FactoriesBoard({
	factories,
	center,
	bagCount,
	view,
	onClick,
	$T,
}: {
	factories: Factory[];
	center: RenderCtx['board']['center'];
	bagCount: number;
	view: ViewType;
	onClick?: string;
	$T: TranslationFn;
}): ReactElement {
	const layout = FACTORY_LAYOUT[factories.length] ?? factories.map((_, i) => i);
	const cellToFactory = new Map(layout.map((cell, factoryIndex) => [cell, factoryIndex]));
	const active = !!(view.active && onClick && (view.action === VIEW_ACTION_TYPE.NONE || view.action === VIEW_ACTION_TYPE.PLACE));
	const selected = view.active && view.action === VIEW_ACTION_TYPE.PLACE ? { source: view.source, color: view.color } : null;

	return (
		<div style={{ display: 'inline-block', verticalAlign: 'top', margin: 8 }}>
			<table style={{ borderCollapse: 'separate', borderSpacing: 6, display: 'inline-block' }}>
				<tbody>
					{[0, 1, 2].map(row => (
						<tr>
							{[0, 1, 2].map(col => {
								const cell = row * 3 + col;
								const factoryIndex = cellToFactory.get(cell);
								if (factoryIndex === undefined) {
									return <td style={{ width: FACTORY_SIZE, height: FACTORY_SIZE }} />;
								}
								const factory = factories[factoryIndex];
								const selectedProp = selected ? (selected.source === factoryIndex ? selected.color : false) : null;
								return (
									<td>
										<FactoryDisplay
											factory={factory}
											{...(active
												? {
														onClick,
														source: String(factoryIndex),
														selected: selectedProp,
													}
												: {})}
										/>
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
			<div style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 12, textAlign: 'center' }}>
				<div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{$T('GAME.AZUL.LABELS.WASTE')}</div>
				<div
					style={{
						minWidth: FACTORY_SIZE,
						background: SS,
						border: `2px solid ${B}`,
						borderRadius: 12,
						padding: 6,
						textAlign: 'center',
					}}
				>
					<TileCountList
						pile={center}
						size={28}
						first={center.first}
						{...(active
							? {
									onClick,
									source: 'center',
									selected: selected ? (selected.source === 'center' ? selected.color : false) : null,
								}
							: {})}
					/>
				</div>
				<div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>{$T('GAME.AZUL.LABELS.BAG', { count: bagCount })}</div>
			</div>
		</div>
	);
}

export function render(this: This, ctx: RenderCtx): ReactElement {
	const onClick = ctx.view.active ? this.msg : undefined;
	const self = ctx.view.type === 'player' ? ctx.players[ctx.view.self] : null;
	const $T = ctx.$T;

	const placing = ctx.view.active && ctx.view.action === VIEW_ACTION_TYPE.PLACE ? ctx.view : null;

	if (ctx.wallsOnly) {
		return (
			<center>
				{ctx.header ? <h1 style={{ margin: '8px 0', fontSize: 20 }}>{ctx.header}</h1> : null}
				<div>
					{ctx.turns.map(turn => (
						<PlayerWallView data={ctx.players[turn]} freeGrid={ctx.freeGrid} />
					))}
				</div>
			</center>
		);
	}

	return (
		<center>
			<div style={{ margin: '4px 0', fontSize: 14, opacity: 0.85 }}>{$T('GAME.AZUL.LABELS.ROUND', { round: ctx.round })}</div>
			{ctx.header ? <h1 style={{ margin: '8px 0', opacity: ctx.dimHeader ? 0.5 : 1, fontSize: 20 }}>{ctx.header}</h1> : null}
			{!ctx.ended ? (
				<div>
					<FactoriesBoard
						factories={ctx.board.factories}
						center={ctx.board.center}
						bagCount={ctx.bag.length}
						view={ctx.view}
						$T={$T}
						{...(onClick ? { onClick } : {})}
					/>
				</div>
			) : null}
			{self ? (
				<div>
					<PlayerBoardView
						data={self}
						freeGrid={ctx.freeGrid}
						$T={$T}
						{...(placing && onClick ? { place: { color: placing.color, count: placing.count, onClick } } : {})}
					/>
				</div>
			) : null}
			{ctx.view.active && ctx.view.action === POST_TURN_ACTIONS.WALL && onClick && self ? (
				<div>
					<WallMenu player={self} row={ctx.view.pending.row} color={ctx.view.pending.color} onClick={onClick} $T={$T} />
				</div>
			) : null}
			<hr />
			<div>
				{ctx.turns
					.filter(turn => turn !== (ctx.view.type === 'player' ? ctx.view.self : null))
					.map(turn => (
						<PlayerBoardView data={ctx.players[turn]} freeGrid={ctx.freeGrid} $T={$T} {...(!ctx.ended ? { compact: true } : {})} />
					))}
			</div>
		</center>
	);
}
