import { Table } from '@/ps/games/render';
import { isAprilFoolsActive } from '@/ps/specialEvents';
import { Button, Form } from '@/utils/components/ps';

import type { RenderCtx } from '@/ps/games/chess/types';
import type { CellRenderer } from '@/ps/games/render';
import type { Chess, Square } from 'chess.js';
import type { ReactElement } from 'react';

type This = { msg: string };

function getSquare(x: number, y: number, flip: boolean): Square {
	return ((flip ? 8 - y : y + 1).toLetter().toLowerCase() + (flip ? x + 1 : 8 - x)) as Square;
}

type BoardCell = ReturnType<Chess['board']>[number][number];

function getPieceImage(_piece: string): string {
	const piece = _piece.toUpperCase();
	// Knook override for April Fools
	if ((piece.endsWith('N') || piece.endsWith('R')) && isAprilFoolsActive()) {
		return `${process.env.WEB_URL}/static/chess/${piece.charAt(0).toUpperCase()}KN.png`;
	}
	return `${process.env.WEB_URL}/static/chess/${piece}.png`;
}

function adaptBoard(board: BoardCell[][], flip: boolean): BoardCell[][] {
	if (!flip) return board;
	return board.map(row => row.toReversed()).reverse();
}

export function renderBoard(this: This, ctx: RenderCtx) {
	const size = 45;
	const flip = ctx.side === 'B';

	const Cell: CellRenderer<BoardCell> = ({ cell, i, j }) => {
		const square = getSquare(i, j, flip);
		const action = ctx.showMoves.find(move => move.to === square);
		// Use the form during promotions instead
		const clickable =
			ctx.isActive && !ctx.promotion && (cell?.color === ctx.turn.toLowerCase() || square === ctx.selected || !!action);

		let background = (i + j) % 2 ? ctx.theme.B : ctx.theme.W;
		if (ctx.selected && square === ctx.selected) background = ctx.theme.sel;

		let overlay = 'none';
		if (action && ctx.theme.hl) overlay = ctx.theme.hl;
		else if (ctx.theme.last && (ctx.lastMove?.from === square || ctx.lastMove?.to === square)) overlay = ctx.theme.last;

		const label = cell?.type ? `${cell.color}${cell.type}` : null;

		return (
			<td style={{ height: size, width: size, background, borderCollapse: 'collapse', padding: 0 }}>
				{clickable ? (
					<Button
						value={action ? `${this.msg} ! move ${action.san}` : `${this.msg} ! select ${square}`}
						style={{ background: overlay, border: 'none', height: size, width: size, padding: 0, display: 'block' }}
					>
						{label ? <img src={getPieceImage(label)} height={size} width={size} alt={label} /> : null}
					</Button>
				) : (
					<div style={{ background: overlay, height: size, width: size, padding: 0 }}>
						{label ? <img src={getPieceImage(label)} height={size} width={size} alt={label} style={{ display: 'block' }} /> : null}
					</div>
				)}
			</td>
		);
	};

	return (
		<Table<BoardCell>
			board={adaptBoard(ctx.board, flip)}
			labels={{ row: flip ? '1-9' : '9-1', col: flip ? 'Z-A' : 'A-Z' }}
			Cell={Cell}
		/>
	);
}

export function render(this: This, ctx: RenderCtx): ReactElement {
	return (
		<center>
			<h1 style={ctx.dimHeader ? { color: 'gray' } : {}}>{ctx.header}</h1>
			{renderBoard.bind(this)(ctx)}
			{ctx.promotion && ctx.showMoves.length ? (
				<Form value={`${this.msg} ! move {move}`}>
					<label>
						Promotion:
						<select name="move" style={{ margin: 4 }}>
							{ctx.showMoves.map(move => (
								<option value={move.san} key={move.san}>
									{move.san}
								</option>
							))}
						</select>
					</label>
					<button style={{ margin: 8 }}>Go!</button>
				</Form>
			) : null}
		</center>
	);
}
