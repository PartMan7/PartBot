import {
	ACTIONS,
	FACTORY_LAYOUT,
	PATTERN_LENGTHS,
	POST_TURN_ACTIONS,
	TILES,
	TILE_ART,
	TILE_COLORS,
	TILE_LABELS,
	VIEW_ACTION_TYPE,
	WALL_PATTERN,
} from '@/ps/games/azul/constants';
import { Username } from '@/utils/components';
import { Button } from '@/utils/components/ps';

import type { Tile } from '@/ps/games/azul/constants';
import type { Factory, FloorTile, PlayerBoard, RenderCtx, ViewType } from '@/ps/games/azul/types';
import type { CSSProperties, ReactElement } from 'react';

type This = { msg: string };

const FACTORY_SIZE = 96;
const TILE_SIZE = 22;

/** Theme-neutral translucent surfaces */
const SURFACE = 'rgba(128,128,128,0.22)';
const SURFACE_STRONG = 'rgba(128,128,128,0.35)';
const WASTE_BG = 'rgba(28,28,28,0.92)';
const BORDER = 'rgba(128,128,128,0.55)';
const MENU_BG = 'rgba(128,128,128,0.3)';

function tileFill(tile: Tile): string {
	return `no-repeat center/95% url(${process.env.WEB_URL}/static/splendor/type/${TILE_ART[tile]}), ${TILE_COLORS[tile]}`;
}
function EmptyCircle({ size, color }: { size: number; color?: string }): ReactElement {
	const dot = Math.max(10, Math.round(size * 0.55));
	return (
		<table style={{ width: size, height: size, borderCollapse: 'collapse', display: 'inline-table', verticalAlign: 'middle' }}>
			<tbody>
				<tr>
					<td style={{ textAlign: 'center', verticalAlign: 'middle', padding: 0, width: size, height: size }}>
						<div
							style={{
								display: 'inline-block',
								width: dot,
								height: dot,
								borderRadius: '50%',
								background: color ? `${color}77` : 'rgba(180,180,180,0.4)',
								border: '1px solid rgba(180,180,180,0.35)',
								boxSizing: 'border-box',
							}}
						/>
					</td>
				</tr>
			</tbody>
		</table>
	);
}

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
					border: '1px solid rgba(0,0,0,0.45)',
					borderRadius: 6,
					margin: 1,
					verticalAlign: 'middle',
					boxSizing: 'border-box',
					color: '#0d47a1',
					fontWeight: 'bold',
					fontSize: Math.max(11, size * 0.7),
					lineHeight: `${size - 2}px`,
					textAlign: 'center',
					...style,
				}}
				title="1st Player (-1)"
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
					background: 'transparent',
					border: `1px solid ${BORDER}`,
					borderRadius: 4,
					margin: 1,
					verticalAlign: 'middle',
					boxSizing: 'border-box',
					...style,
				}}
			>
				<EmptyCircle size={size - 2} />
			</div>
		);
	}
	return (
		<div
			style={{
				display: 'inline-block',
				width: size,
				height: size,
				background: tileFill(tile),
				border: '1px solid rgba(255,255,255,0.75)',
				borderRadius: 6,
				margin: 1,
				verticalAlign: 'middle',
				boxSizing: 'border-box',
				boxShadow: '0 0 0 1px rgba(0,0,0,0.55)',
				...style,
			}}
			title={TILE_LABELS[tile]}
		/>
	);
}

function factoryColors(factory: Factory): Tile[] {
	return TILES.filter(tile => (factory[tile] ?? 0) > 0);
}

function FactoryDisplay({ factory, first, waste }: { factory: Factory; first?: boolean; waste?: boolean }): ReactElement {
	if (waste) {
		const entries = TILES.filterMap(tile => {
			const n = factory[tile] ?? 0;
			if (n > 0) return { tile, n };
		});
		const chip = 18;
		return (
			<div
				style={{
					minWidth: FACTORY_SIZE,
					background: WASTE_BG,
					border: '2px dashed rgba(180,180,180,0.45)',
					borderRadius: 4,
					padding: 6,
					boxSizing: 'border-box',
					textAlign: 'left',
				}}
			>
				<table style={{ borderCollapse: 'collapse', margin: '0 auto' }}>
					<tbody>
						{entries.map(({ tile, n }) => (
							<tr>
								<td style={{ padding: '1px 2px', verticalAlign: 'middle' }}>
									<TileChip tile={tile} size={chip} style={{ margin: 0 }} />
								</td>
								<td
									style={{
										padding: '1px 2px',
										verticalAlign: 'middle',
										fontWeight: 'bold',
										fontSize: 11,
										color: 'rgba(200,200,200,0.95)',
										whiteSpace: 'nowrap',
									}}
								>
									x{n}
								</td>
							</tr>
						))}
						{first ? (
							<tr>
								<td style={{ padding: '1px 2px', verticalAlign: 'middle' }} colSpan={2}>
									<TileChip tile="first" size={chip} style={{ margin: 0 }} />
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
			</div>
		);
	}

	const chips: (Tile | 'empty')[] = [];
	TILES.forEach(tile => {
		const n = factory[tile] ?? 0;
		for (let i = 0; i < n; i++) chips.push(tile);
	});
	while (chips.length < 4) chips.push('empty');

	return (
		<div
			style={{
				width: FACTORY_SIZE,
				height: FACTORY_SIZE,
				background: SURFACE_STRONG,
				border: `2px solid ${BORDER}`,
				borderRadius: 12,
				padding: 6,
				boxSizing: 'border-box',
			}}
		>
			<table style={{ width: '100%', height: '100%', borderCollapse: 'collapse' }}>
				<tbody>
					<tr>
						<td style={{ width: '50%', height: '50%', textAlign: 'center', verticalAlign: 'middle', padding: 1 }}>
							<TileChip tile={chips[0]} size={28} style={{ margin: 0 }} />
						</td>
						<td style={{ width: '50%', height: '50%', textAlign: 'center', verticalAlign: 'middle', padding: 1 }}>
							<TileChip tile={chips[1]} size={28} style={{ margin: 0 }} />
						</td>
					</tr>
					<tr>
						<td style={{ width: '50%', height: '50%', textAlign: 'center', verticalAlign: 'middle', padding: 1 }}>
							<TileChip tile={chips[2]} size={28} style={{ margin: 0 }} />
						</td>
						<td style={{ width: '50%', height: '50%', textAlign: 'center', verticalAlign: 'middle', padding: 1 }}>
							<TileChip tile={chips[3]} size={28} style={{ margin: 0 }} />
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}

function ColorPickMenu({ pile, onClick, source }: { pile: Factory; onClick: string; source: string }): ReactElement {
	return (
		<div style={{ borderRadius: 12, padding: 8, background: MENU_BG, margin: '12px auto', display: 'inline-block' }}>
			<div style={{ marginBottom: 4, fontSize: 12, opacity: 0.85 }}>Pick a tile</div>
			{TILES.filterMap(tile => {
				const n = pile[tile] ?? 0;
				if (n <= 0) return;
				return (
					<Button
						value={`${onClick} ! ${ACTIONS.TAKE} ${source} ${tile}`}
						style={{
							cursor: 'pointer',
							padding: 4,
							margin: 2,
							border: 'none',
							background: 'transparent',
							verticalAlign: 'middle',
						}}
						title={TILE_LABELS[tile]}
					>
						{Array.from({ length: n }).map(() => (
							<TileChip tile={tile} size={28} style={{ margin: 1 }} />
						))}
					</Button>
				);
			})}
		</div>
	);
}

function canPlaceOnRow(player: PlayerBoard, row: number, color: Tile): boolean {
	const line = player.pattern[row];
	if (line.every(t => t !== null)) return false;
	const existing = line.find(t => t !== null);
	if (existing && existing !== color) return false;
	if (player.wall[row].some(cell => cell === color)) return false;
	return true;
}

function PlaceMenu({
	player,
	color,
	count,
	onClick,
}: {
	player: PlayerBoard;
	color: Tile;
	count: number;
	onClick: string;
}): ReactElement {
	return (
		<div style={{ borderRadius: 12, padding: 8, background: MENU_BG, margin: '8px auto', display: 'inline-block' }}>
			<div style={{ marginBottom: 6 }}>
				Place {count}x <TileChip tile={color} />
			</div>
			{PATTERN_LENGTHS.map((_, row) => {
				if (!canPlaceOnRow(player, row, color)) return null;
				return (
					<Button value={`${onClick} ! ${ACTIONS.PLACE} ${row}`} style={{ cursor: 'pointer', margin: 2, padding: '4px 8px' }}>
						Row {row + 1}
					</Button>
				);
			})}
			<Button value={`${onClick} ! ${ACTIONS.PLACE} floor`} style={{ cursor: 'pointer', margin: 2, padding: '4px 8px' }}>
				Floor
			</Button>
		</div>
	);
}

function WallMenu({ player, row, color, onClick }: { player: PlayerBoard; row: number; color: Tile; onClick: string }): ReactElement {
	const cols = [0, 1, 2, 3, 4].filter(col => player.wall[row][col] === null && !player.wall.some(wallRow => wallRow[col] === color));
	return (
		<div style={{ borderRadius: 12, padding: 8, background: MENU_BG, margin: '8px auto', display: 'inline-block' }}>
			<div style={{ marginBottom: 6 }}>
				Wall row {row + 1}: <TileChip tile={color} />
			</div>
			{cols.map(col => (
				<Button value={`${onClick} ! ${POST_TURN_ACTIONS.WALL} ${col}`} style={{ cursor: 'pointer', margin: 2 }}>
					Column {col + 1}
				</Button>
			))}
		</div>
	);
}

function BoardRows({
	pattern,
	wall,
	freeGrid,
}: {
	pattern: (Tile | null)[][];
	wall: (Tile | null)[][];
	freeGrid: boolean;
}): ReactElement {
	const cell = TILE_SIZE + 4;
	return (
		<table style={{ borderCollapse: 'collapse', display: 'inline-block', verticalAlign: 'top' }}>
			<tbody>
				{pattern.map((line, i) => (
					<tr>
						<td style={{ opacity: 0.6, paddingRight: 4, fontSize: 11, height: cell, verticalAlign: 'middle' }}>{i + 1}</td>
						{Array.from({ length: 5 - line.length }).map(() => (
							<td style={{ width: cell, height: cell, padding: 0 }} />
						))}
						{line.map(tile => (
							<td style={{ width: cell, height: cell, padding: 0, textAlign: 'center', verticalAlign: 'middle' }}>
								<TileChip tile={tile ?? 'empty'} size={TILE_SIZE} style={{ margin: 0 }} />
							</td>
						))}
						<td style={{ width: 10, height: cell, padding: 0 }} />
						{wall[i].map((filled, j) => {
							const hint = freeGrid ? null : WALL_PATTERN[i][j];
							if (filled) {
								return (
									<td
										style={{
											width: cell,
											height: cell,
											padding: 1,
											boxSizing: 'border-box',
											border: `1px solid ${BORDER}`,
											background: `${TILE_COLORS[filled]}55`,
										}}
										title={TILE_LABELS[filled]}
									>
										<div
											style={{
												width: '100%',
												height: '100%',
												background: tileFill(filled),
												border: '1px solid rgba(255,255,255,0.75)',
												borderRadius: 6,
												boxSizing: 'border-box',
												boxShadow: '0 0 0 1px rgba(0,0,0,0.55)',
											}}
										/>
									</td>
								);
							}
							const hintColor = hint ? TILE_COLORS[hint] : undefined;
							return (
								<td
									style={{
										width: cell,
										height: cell,
										border: `1px solid ${BORDER}`,
										background: hintColor ? `${hintColor}28` : 'transparent',
										boxSizing: 'border-box',
										padding: 0,
									}}
									title={hint ? TILE_LABELS[hint] : undefined}
								>
									<EmptyCircle size={cell} {...(hintColor ? { color: hintColor } : {})} />
								</td>
							);
						})}
					</tr>
				))}
			</tbody>
		</table>
	);
}

function FloorLine({ floor }: { floor: FloorTile[] }): ReactElement {
	return (
		<div style={{ marginTop: 8 }}>
			<span style={{ fontSize: 12, opacity: 0.65, marginRight: 6 }}>Floor</span>
			{Array.from({ length: 7 }).map((_, i) => (
				<TileChip tile={floor[i] ?? 'empty'} size={18} />
			))}
		</div>
	);
}

function PlayerBoardView({ data, freeGrid, compact }: { data: PlayerBoard; freeGrid: boolean; compact?: boolean }): ReactElement {
	return (
		<div
			style={{
				display: 'inline-block',
				verticalAlign: 'top',
				margin: 8,
				padding: 8,
				background: SURFACE,
				border: `1px solid ${BORDER}`,
				borderRadius: 8,
				zoom: compact ? '70%' : undefined,
			}}
		>
			<div style={{ marginBottom: 6 }}>
				<Username name={data.name} clickable /> - <b>{data.score}</b>
			</div>
			<BoardRows pattern={data.pattern} wall={data.wall} freeGrid={freeGrid} />
			{!compact || data.floor.length > 0 ? <FloorLine floor={data.floor} /> : null}
		</div>
	);
}

function FactoriesBoard({
	factories,
	center,
	view,
	onClick,
}: {
	factories: Factory[];
	center: RenderCtx['board']['center'];
	view: ViewType;
	onClick?: string;
}): ReactElement {
	const layout = FACTORY_LAYOUT[factories.length] ?? factories.map((_, i) => i);
	const cellToFactory = new Map(layout.map((cell, factoryIndex) => [cell, factoryIndex]));
	const active = !!(view.active && onClick);
	const selectingFactory = view.active && view.action === VIEW_ACTION_TYPE.CLICK_FACTORY ? view.factoryIndex : null;
	const selectingCenter = view.active && view.action === VIEW_ACTION_TYPE.CLICK_CENTER;

	return (
		<div style={{ display: 'inline-block', verticalAlign: 'top', margin: 8 }}>
			<table style={{ borderCollapse: 'separate', borderSpacing: 6, display: 'inline-block', verticalAlign: 'middle' }}>
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
								const colors = factoryColors(factory);
								const open = selectingFactory === factoryIndex;
								const clickable = active && colors.length > 0 && !open && view.action !== VIEW_ACTION_TYPE.PLACE;
								const content = <FactoryDisplay factory={factory} />;
								return (
									<td style={{ verticalAlign: 'middle' }}>
										{clickable ? (
											<Button
												value={`${onClick} ! ${VIEW_ACTION_TYPE.CLICK_FACTORY} ${factoryIndex}`}
												style={{ cursor: 'pointer', padding: 0, border: 'none', background: 'none', color: 'inherit' }}
											>
												{content}
											</Button>
										) : (
											content
										)}
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
			<div style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 12 }}>
				<div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Waste</div>
				{(() => {
					const colors = factoryColors(center);
					const clickable = active && colors.length > 0 && !selectingCenter && view.action !== VIEW_ACTION_TYPE.PLACE;
					const content = <FactoryDisplay factory={center} first={center.first} waste />;
					return clickable ? (
						<Button
							value={`${onClick} ! ${VIEW_ACTION_TYPE.CLICK_CENTER}`}
							style={{ cursor: 'pointer', padding: 0, border: 'none', background: 'none', color: 'inherit' }}
						>
							{content}
						</Button>
					) : (
						content
					);
				})()}
			</div>
		</div>
	);
}

export function render(this: This, ctx: RenderCtx): ReactElement {
	const onClick = ctx.view.active ? this.msg : undefined;
	const self = ctx.view.type === 'player' ? ctx.players[ctx.view.self] : null;

	const selectingFactory = ctx.view.active && ctx.view.action === VIEW_ACTION_TYPE.CLICK_FACTORY ? ctx.view.factoryIndex : null;
	const selectingCenter = ctx.view.active && ctx.view.action === VIEW_ACTION_TYPE.CLICK_CENTER;

	return (
		<center>
			{ctx.header ? (
				<h1
					style={{
						margin: '8px 0',
						opacity: ctx.dimHeader ? 0.5 : 1,
						fontSize: 20,
					}}
				>
					{ctx.header}
				</h1>
			) : null}
			<div>
				<FactoriesBoard factories={ctx.board.factories} center={ctx.board.center} view={ctx.view} {...(onClick ? { onClick } : {})} />
			</div>
			{onClick && selectingFactory !== null ? (
				<div>
					<ColorPickMenu pile={ctx.board.factories[selectingFactory]} onClick={onClick} source={String(selectingFactory)} />
				</div>
			) : null}
			{onClick && selectingCenter ? (
				<div>
					<ColorPickMenu pile={ctx.board.center} onClick={onClick} source="center" />
				</div>
			) : null}
			{self ? (
				<div>
					<PlayerBoardView data={self} freeGrid={ctx.freeGrid} />
				</div>
			) : null}
			{ctx.view.active && ctx.view.action === VIEW_ACTION_TYPE.PLACE && onClick && self ? (
				<div>
					<PlaceMenu player={self} color={ctx.view.color} count={ctx.view.count} onClick={onClick} />
				</div>
			) : null}
			{ctx.view.active && ctx.view.action === POST_TURN_ACTIONS.WALL && onClick && self ? (
				<div>
					<WallMenu player={self} row={ctx.view.pending.row} color={ctx.view.pending.color} onClick={onClick} />
				</div>
			) : null}
			<hr />
			<div>
				{ctx.turns
					.filter(turn => turn !== (ctx.view.type === 'player' ? ctx.view.self : null))
					.map(turn => (
						<PlayerBoardView data={ctx.players[turn]} freeGrid={ctx.freeGrid} compact />
					))}
			</div>
		</center>
	);
}
