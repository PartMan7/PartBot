import { Table } from '@/ps/games/render';
import { Button, Form } from '@/utils/components/ps';

import type { RenderCtx, Turn } from '@/ps/games/chess/types';
import type { CellRenderer } from '@/ps/games/render';
import type { Chess, Square } from 'chess.js';
import type { ReactElement } from 'react';

type This = { msg: string };

function getSquare(x: number, y: number, side: Turn | null): Square {
	const flip = side === 'B';
	return ((flip ? 8 - y : y + 1).toLetter().toLowerCase() + (flip ? x + 1 : 8 - x)) as Square;
}

type BoardCell = ReturnType<Chess['board']>[number][number];

const PIECE_IMAGES: Record<string, string> = {
	wk: 'https://partbot.partman.dev/public/chess/WK.png',
	wq: 'https://partbot.partman.dev/public/chess/WQ.png',
	wb: 'https://partbot.partman.dev/public/chess/WB.png',
	wn: 'https://partbot.partman.dev/public/chess/WN.png',
	wr: 'https://partbot.partman.dev/public/chess/WR.png',
	wp: 'https://partbot.partman.dev/public/chess/WP.png',
	bk: 'https://partbot.partman.dev/public/chess/BK.png',
	bq: 'https://partbot.partman.dev/public/chess/BQ.png',
	bb: 'https://partbot.partman.dev/public/chess/BB.png',
	bn: 'https://partbot.partman.dev/public/chess/BN.png',
	br: 'https://partbot.partman.dev/public/chess/BR.png',
	bp: 'https://partbot.partman.dev/public/chess/BP.png',
};

function adaptBoard(board: BoardCell[][], side: Turn | null): BoardCell[][] {
	if (side !== 'B') return board;
	return board.map(row => row.toReversed()).reverse();
}

export function renderBoard(this: This, ctx: RenderCtx) {
	const size = ctx.small ? 30 : 45;

	const Cell: CellRenderer<BoardCell> = ({ cell, i, j }) => {
		const square = getSquare(i, j, ctx.side);
		const action = ctx.showMoves.find(move => move.to === square);
		// Use the form during promotions instead
		const clickable =
			ctx.isActive && !ctx.promotion && (cell?.color === ctx.turn.toLowerCase() || square === ctx.selected || !!action);

		let background = (i + j) % 2 ? ctx.theme.B : ctx.theme.W;
		if (ctx.selected && square === ctx.selected) background = ctx.theme.sel;

		let overlay = 'none';
		if (action && ctx.theme.hl) overlay = ctx.theme.hl;
		// TODO: Last move

		const label = cell?.type ? `${cell.color}${cell.type}` : null;

		return (
			<td style={{ height: size, width: size, background, borderCollapse: 'collapse', padding: 0 }}>
				{clickable ? (
					<Button
						value={action ? `${this.msg} ! move ${action.san}` : `${this.msg} ! select ${square}`}
						style={{ background: overlay, border: 'none', height: size, width: size, padding: 0, display: 'block' }}
					>
						{label ? <img src={PIECE_IMAGES[label]} height={size} width={size} alt={label} /> : null}
					</Button>
				) : label ? (
					<img src={PIECE_IMAGES[label]} height={size} width={size} alt={label} style={{ display: 'block' }} />
				) : null}
			</td>
		);
	};

	return <Table<BoardCell> board={adaptBoard(ctx.board, ctx.side)} labels={{ row: '9-1', col: 'A-Z' }} Cell={Cell} />;
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
