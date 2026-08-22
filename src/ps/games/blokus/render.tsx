import { CORNERS, PIECES, PLAYER_COLORS } from '@/ps/games/blokus/constants';
import { Table } from '@/ps/games/render';
import { Button } from '@/utils/components/ps';

import type { RenderCtx, Turn } from '@/ps/games/blokus/types';
import type { CellRenderer } from '@/ps/games/render';
import type { ReactElement } from 'react';

type This = { msg: string };

const BLOCK = 16;
const GAP = 1;
const DOT = 10;

function playerColor(ctx: RenderCtx, turn: string): string {
	return ctx.colors[ctx.playerIndex[turn] ?? 0];
}

function cornerFor(size: number, playerIndex: number): [number, number] {
	const [ci, cj] = CORNERS[playerIndex];
	return [ci < 0 ? size - 1 : 0, cj < 0 ? size - 1 : 0];
}

function PieceMini({
	cells,
	color,
	size = BLOCK,
	refCell,
	showStar = false,
}: {
	cells: readonly (readonly [number, number])[];
	color: string;
	size?: number;
	refCell?: readonly [number, number];
	showStar?: boolean;
}): ReactElement {
	const minX = Math.min(...cells.map(([x]) => x));
	const minY = Math.min(...cells.map(([, y]) => y));
	const maxX = Math.max(...cells.map(([x]) => x));
	const maxY = Math.max(...cells.map(([, y]) => y));
	const [rx, ry] = refCell ?? [0, 0];

	const w = (maxX - minX + 1) * (size + GAP) + GAP;
	const h = (maxY - minY + 1) * (size + GAP) + GAP;
	const star = showStar ? '★' : '';

	return (
		<div style={{ position: 'relative', width: w, height: h }}>
			{cells.map(([x, y]) => (
				<div
					key={`${x},${y}`}
					style={{
						position: 'absolute',
						left: GAP + (x - minX) * (size + GAP),
						top: GAP + (y - minY) * (size + GAP),
						width: size,
						height: size,
						background: color,
						borderRadius: 2,
						fontSize: size > 10 ? size - 4 : 8,
						lineHeight: `${size}px`,
						textAlign: 'center',
					}}
				>
					{star && x === rx && y === ry ? star : null}
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
	const corners = new Map<string, number>();
	Object.entries(ctx.playerIndex).forEach(([, idx]) => {
		const [ci, cj] = cornerFor(ctx.size, idx);
		corners.set(`${ci},${cj}`, idx);
	});

	const Cell: CellRenderer<Turn | null> = ({ cell, i, j }) => {
		const key = `${i},${j}`;
		const isAnchor = anchors.has(key);
		const cornerIdx = corners.get(key);

		return (
			<td style={{ ...td, background: cell ? playerColor(ctx, cell) : slate }}>
				{cell ? null : isAnchor ? (
					<Button
						value={`${this.msg} ! place ${i}-${j}`}
						style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: line, display: 'block' }}
					>
						<div style={{ ...dot, borderColor: line }} />
					</Button>
				) : cornerIdx !== undefined ? (
					<div style={{ ...dot, borderRadius: 2, borderColor: PLAYER_COLORS[cornerIdx] }} />
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
	if (!ctx.isActive || !ctx.side || !ctx.pieces[ctx.side].length) return null;
	const pieces = [...ctx.pieces[ctx.side]].sort((a, b) => PIECES[b].size - PIECES[a].size || a.localeCompare(b));

	return (
		<div style={{ margin: '12px 0' }}>
			<b>Your pieces</b>
			<div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'flex-end', justifyContent: 'center', marginTop: 6 }}>
				{pieces.map(pieceId => (
					<Button
						key={pieceId}
						value={`${this.msg} ! select ${pieceId}`}
						style={{
							background: 'none',
							border: 'none',
							padding: 2,
							cursor: 'pointer',
							outline: ctx.selectedPiece === pieceId ? '2px solid currentColor' : 'none',
						}}
					>
						<PieceMini cells={PIECES[pieceId].cells} color={playerColor(ctx, ctx.side!)} refCell={PIECES[pieceId].ref} size={11} showStar />
					</Button>
				))}
			</div>
		</div>
	);
}

function OrientationPicker(this: This, ctx: RenderCtx): ReactElement | null {
	if (!ctx.isActive || !ctx.selectedPiece || !ctx.orientations) return null;

	return (
		<div style={{ margin: '12px 0' }}>
			<b>Pick orientation</b> (★ = anchor)
			<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end', justifyContent: 'center', marginTop: 6 }}>
				{ctx.orientations.map((orient, i) => (
					<Button
						key={i}
						value={`${this.msg} ! orient ${i}`}
						style={{
							background: 'none',
							border: 'none',
							padding: 2,
							cursor: 'pointer',
							outline: ctx.selectedOrient === i ? '2px solid currentColor' : 'none',
						}}
					>
						<PieceMini cells={orient} color={playerColor(ctx, ctx.side!)} refCell={[0, 0]} size={14} showStar />
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
			<div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', margin: '8px 0', fontSize: 13 }}>
				{Object.entries(ctx.players).map(([turn, player]) => (
					<span key={turn} style={{ fontWeight: turn === ctx.turn ? 'bold' : 'normal' }}>
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
			{ctx.isActive && ctx.selectedOrient !== null ? <small>Click a dotted circle to place your piece</small> : null}
		</center>
	);
}
