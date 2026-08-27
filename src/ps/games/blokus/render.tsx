import { PIECES } from '@/ps/games/blokus/constants';
import { Table } from '@/ps/games/render';
import { Button, Username } from '@/utils/components/ps';

import type { RenderCtx, Turn } from '@/ps/games/blokus/types';
import type { CellRenderer } from '@/ps/games/render';
import type { CSSProperties, ReactElement } from 'react';

type This = { msg: string };

const BLOCK = 16;
const GAP = 1;
const DOT = 10;
const BTN: CSSProperties = { background: 'none', color: 'inherit', cursor: 'pointer' };
const TRAY: CSSProperties = { overflowX: 'auto', maxWidth: '90%', marginTop: 6 };
const TRAY_ITEM: CSSProperties = { display: 'inline-block', verticalAlign: 'bottom', marginRight: 6 };

function playerColor(ctx: RenderCtx, turn: string): string {
	return ctx.colors[ctx.playerIndex[turn]];
}

function PieceMini({
	cells,
	color,
	size = BLOCK,
	refCell,
	energy,
}: {
	cells: readonly (readonly [number, number])[];
	color: string;
	size?: number;
	refCell?: readonly [number, number];
	energy: string;
}): ReactElement {
	const minRow = Math.min(...cells.map(([row]) => row));
	const minCol = Math.min(...cells.map(([, col]) => col));
	const maxRow = Math.max(...cells.map(([row]) => row));
	const maxCol = Math.max(...cells.map(([, col]) => col));
	const [refRow, refCol] = refCell ?? [0, 0];
	const [baseRow, baseCol] = cells[0];

	const w = (maxCol - minCol + 1) * (size + GAP) + GAP;
	const h = (maxRow - minRow + 1) * (size + GAP) + GAP;
	const shadows = cells
		.slice(1)
		.map(([row, col]) => `${(col - baseCol) * (size + GAP)}px ${(row - baseRow) * (size + GAP)}px 0 ${color}`)
		.join(',');
	const marker =
		energy && refCell ? (
			<img
				src={`${process.env.WEB_URL}/static/splendor/type/${energy}.png`}
				width={size - 2}
				height={size - 2}
				style={{
					position: 'absolute',
					left: GAP + (refCol - minCol) * (size + GAP) + 1,
					top: GAP + (refRow - minRow) * (size + GAP) + 1,
				}}
			/>
		) : null;

	return (
		<div style={{ position: 'relative', width: w, height: h, pointerEvents: 'none' }}>
			<div
				style={{
					position: 'absolute',
					left: GAP + (baseCol - minCol) * (size + GAP),
					top: GAP + (baseRow - minRow) * (size + GAP),
					width: size,
					height: size,
					background: color,
					borderRadius: 2,
					boxShadow: shadows || undefined,
				}}
			/>
			{marker}
		</div>
	);
}

function renderBoard(this: This, ctx: RenderCtx): ReactElement {
	const slate = '#1a2332';
	const line = '#e8eaed';
	const grid = '#2e3848';
	const dot = { width: DOT, height: DOT, margin: '3px auto', border: '2px dashed', borderRadius: 99 };
	const anchors = new Set(ctx.validAnchors.map(([i, j]) => `${i},${j}`));

	const Cell: CellRenderer<Turn | null> = ({ cell, i, j }) => {
		const key = `${i},${j}`;
		const isAnchor = anchors.has(key);

		return (
			<td width={BLOCK} height={BLOCK} {...{ bgcolor: cell ? playerColor(ctx, cell) : slate }}>
				{cell ? null : isAnchor && ctx.isActive && ctx.selectedOrient !== null ? (
					<Button
						value={`${this.msg} ! place ${ctx.selectedOrient} ${i}-${j}`}
						style={{ ...dot, background: 'none', display: 'block', padding: 0 }}
					>
						{' '}
					</Button>
				) : null}
			</td>
		);
	};

	return (
		<div style={{ overflow: 'auto', maxWidth: '100%', margin: '8px auto' }}>
			<Table<Turn | null>
				board={ctx.board}
				labels={null}
				Cell={Cell}
				{...{ border: 1, cellPadding: 0, cellSpacing: 0 }}
				style={{ borderCollapse: 'collapse', borderColor: grid, margin: 0, color: line }}
			/>
		</div>
	);
}

function PieceTray(this: This, ctx: RenderCtx): ReactElement | null {
	if (!ctx.side || !ctx.pieces[ctx.side].length) return null;
	const pieces = ctx.pieces[ctx.side];
	const color = playerColor(ctx, ctx.side);
	const energy = ['water', 'electric', 'fire', 'grass'][ctx.playerIndex[ctx.side]];
	const selected = ctx.isActive ? ctx.selectedPiece : null;
	const outline = (pieceId: string) => (selected === pieceId ? '2px solid currentColor' : 'none');

	return (
		<div style={{ margin: '12px 0', maxWidth: '100%' }}>
			<b>Your pieces ({pieces.map(pieceId => PIECES[pieceId].size).sum()} blocks)</b>
			<div style={TRAY}>
				{pieces.map(pieceId => {
					const mini = (
						<PieceMini cells={PIECES[pieceId].cells} color={color} refCell={PIECES[pieceId].ref} size={11} energy={energy} />
					);
					return ctx.isActive ? (
						<Button
							key={pieceId}
							value={`${this.msg} ! select ${pieceId}`}
							style={{ ...BTN, ...TRAY_ITEM, border: 'none', padding: 2, outline: outline(pieceId) }}
						>
							{mini}
						</Button>
					) : (
						<div key={pieceId} style={{ ...TRAY_ITEM, padding: 2 }}>
							{mini}
						</div>
					);
				})}
			</div>
		</div>
	);
}

function OpponentPieces({ ctx }: { ctx: RenderCtx }): ReactElement | null {
	const opponents = Object.entries(ctx.players)
		.filter(([turn]) => !ctx.side || turn !== ctx.side)
		.sortBy(([turn]) => ctx.turns.indexOf(turn));
	if (!opponents.length) return null;

	return (
		<div style={{ margin: '12px 0' }}>
			{opponents.map(([turn, player]) => {
				const pieces = ctx.pieces[turn];
				const blocks = pieces.reduce((sum, pieceId) => sum + PIECES[pieceId].size, 0);
				const energy = ['water', 'electric', 'fire', 'grass'][ctx.playerIndex[turn]];
				return (
					<div key={turn} style={{ margin: '8px 0' }}>
						<Username name={player.name} /> ({blocks} {ctx.$T('GAME.BLOKUS.BLOCKS')})
						<div style={TRAY}>
							{pieces.map(pieceId => (
								<span key={pieceId} style={{ ...TRAY_ITEM, padding: 2 }}>
									<PieceMini cells={PIECES[pieceId].cells} color={playerColor(ctx, turn)} size={11} energy={energy} />
								</span>
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
}

function OrientationPicker(this: This, ctx: RenderCtx): ReactElement | null {
	if (!ctx.isActive || !ctx.selectedPiece || !ctx.orientations) return null;
	if (ctx.orientations.length === 1) return null;
	const energy = ['water', 'electric', 'fire', 'grass'][ctx.playerIndex[ctx.side!]];

	return (
		<div style={{ margin: '12px 0', maxWidth: '100%' }}>
			<b>{ctx.$T('GAME.BLOKUS.PICK_ORIENTATION')}</b> ({ctx.$T('GAME.BLOKUS.ENERGY_ANCHOR')})
			<div style={TRAY}>
				{ctx.orientations.map((orient, i) => (
					<Button
						key={i}
						value={`${this.msg} ! orient ${i}`}
						style={{
							...BTN,
							...TRAY_ITEM,
							border: 'none',
							padding: 2,
							outline: ctx.selectedOrient === i ? '2px solid currentColor' : 'none',
						}}
					>
						<PieceMini cells={orient} color={playerColor(ctx, ctx.side!)} refCell={[0, 0]} size={14} energy={energy} />
					</Button>
				))}
			</div>
		</div>
	);
}

export function render(this: This, ctx: RenderCtx): ReactElement {
	return (
		<center>
			<h1 style={ctx.dimHeader ? { color: 'gray' } : {}}>{ctx.header}</h1>
			<div style={{ margin: '8px 0', fontSize: 13 }}>
				{Object.entries(ctx.players)
					.sortBy(([turn]) => ctx.turns.indexOf(turn))
					.map(([turn, player]) => (
						<span key={turn} style={{ fontWeight: turn === ctx.turn ? 'bold' : 'normal', marginRight: 12 }}>
							<span
								style={{
									display: 'inline-block',
									width: 14,
									height: 14,
									background: playerColor(ctx, turn),
									border: '1px solid gray',
									borderRadius: 2,
									marginRight: 5,
									verticalAlign: 'middle',
								}}
							/>
							{player.name}
							{ctx.pieces[turn]?.length ? ` (${ctx.pieces[turn].length})` : ' ✓'}
							{turn === ctx.turn ? ' ◀' : ''}
						</span>
					))}
			</div>
			{renderBoard.bind(this)(ctx)}
			{OrientationPicker.bind(this)(ctx)}
			{PieceTray.bind(this)(ctx)}
			<OpponentPieces ctx={ctx} />
			{ctx.isActive && ctx.selectedOrient !== null ? <small>{ctx.$T('GAME.BLOKUS.PLACE_HINT')}</small> : null}
		</center>
	);
}
