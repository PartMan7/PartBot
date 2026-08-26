import { PIECES } from '@/ps/games/blokus/constants';
import { Table } from '@/ps/games/render';
import { Button } from '@/utils/components/ps';

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

	const w = (maxCol - minCol + 1) * (size + GAP) + GAP;
	const h = (maxRow - minRow + 1) * (size + GAP) + GAP;
	const marker = <img src={`${process.env.WEB_URL}/static/splendor/type/${energy}.png`} width={size - 2} height={size - 2} />;

	return (
		<div style={{ position: 'relative', width: w, height: h, pointerEvents: 'none' }}>
			{cells.map(([row, col]) => (
				<div
					key={`${row},${col}`}
					style={{
						position: 'absolute',
						left: GAP + (col - minCol) * (size + GAP),
						top: GAP + (row - minRow) * (size + GAP),
						width: size,
						height: size,
						background: color,
						borderRadius: 2,
						fontSize: size > 10 ? size - 4 : 8,
						lineHeight: `${size}px`,
						textAlign: 'center',
					}}
				>
					{marker && row === refRow && col === refCol ? marker : null}
				</div>
			))}
		</div>
	);
}

function renderBoard(this: This, ctx: RenderCtx): ReactElement {
	const slate = '#1a2332';
	const line = '#e8eaed';
	const grid = '#2e3848';
	const td = { padding: 0, width: BLOCK, height: BLOCK, border: `1px solid ${grid}` };
	const dot = { width: DOT, height: DOT, margin: '3px auto', border: '2px dashed', borderRadius: 99 };
	const anchors = new Set(ctx.validAnchors.map(([i, j]) => `${i},${j}`));

	const Cell: CellRenderer<Turn | null> = ({ cell, i, j }) => {
		const key = `${i},${j}`;
		const isAnchor = anchors.has(key);

		return (
			<td style={{ ...td, background: cell ? playerColor(ctx, cell) : slate }}>
				{cell ? null : isAnchor && ctx.isActive && ctx.selectedOrient !== null ? (
					<Button
						value={`${this.msg} ! place ${ctx.selectedOrient} ${i}-${j}`}
						style={{ ...BTN, ...dot, borderColor: line, display: 'block', padding: 0 }}
					>
						{' '}
					</Button>
				) : null}
			</td>
		);
	};

	return (
		<div style={{ overflow: 'auto', maxWidth: '100%', margin: '8px auto' }}>
			<Table<Turn | null> board={ctx.board} labels={null} Cell={Cell} style={{ borderCollapse: 'collapse', margin: 0, color: line }} />
		</div>
	);
}

function PieceTray(this: This, ctx: RenderCtx): ReactElement | null {
	if (!ctx.side || !ctx.pieces[ctx.side].length) return null;
	const pieces = [...ctx.pieces[ctx.side]].sort((a, b) => PIECES[b].size - PIECES[a].size || a.localeCompare(b));
	const color = playerColor(ctx, ctx.side);
	const energy = ['water', 'electric', 'fire', 'grass'][ctx.playerIndex[ctx.side]];
	const selected = ctx.isActive ? ctx.selectedPiece : null;
	const outline = (pieceId: string) => (selected === pieceId ? '2px solid currentColor' : 'none');

	return (
		<div style={{ margin: '12px 0', maxWidth: '100%' }}>
			<b>Your pieces</b>
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
					.sort(([turnA], [turnB]) => ctx.playerIndex[turnA] - ctx.playerIndex[turnB])
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
			{PieceTray.bind(this)(ctx)}
			{OrientationPicker.bind(this)(ctx)}
			{ctx.isActive && ctx.selectedOrient !== null ? <small>{ctx.$T('GAME.BLOKUS.PLACE_HINT')}</small> : null}
		</center>
	);
}
