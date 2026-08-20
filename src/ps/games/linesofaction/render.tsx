import { Table } from '@/ps/games/render';
import { Button } from '@/utils/components/ps';

import type { RenderCtx, Turn } from '@/ps/games/linesofaction/types';
import type { CellRenderer } from '@/ps/games/render';
import type { ReactElement } from 'react';

type This = { msg: string };

const pieceStyles = { height: 24, width: 24, display: 'inline-block', borderRadius: 100, marginLeft: 3, marginTop: 3 };

export function renderBoard(this: This, ctx: RenderCtx) {
	const Cell: CellRenderer<Turn | null> = ({ cell, i, j }) => {
		const selected = ctx.selected?.[0] === i && ctx.selected?.[1] === j;
		const move = ctx.validMoves.find(({ to }) => to[0] === i && to[1] === j);
		const canSelect = ctx.turn && cell === ctx.turn;
		const background = selected ? '#c8d8ff' : (i + j) % 2 ? '#d8b896' : '#f0d9b5';

		return (
			<td style={{ height: 30, width: 30, background, borderCollapse: 'collapse', border: '1px solid black' }}>
				{move ? (
					<Button
						value={`${this.msg} ! move ${move.from[0]}-${move.from[1]}-${move.to[0]}-${move.to[1]}`}
						style={{
							...pieceStyles,
							border: '2px dashed #3366cc',
							background: cell === 'W' ? 'white' : cell === 'B' ? '#333' : '#99c2ff',
						}}
					>
						{' '}
					</Button>
				) : canSelect ? (
					<Button
						value={`${this.msg} ! select ${i}-${j}`}
						style={{ ...pieceStyles, border: selected ? '2px solid #3366cc' : 'none', background: cell === 'W' ? 'white' : '#333' }}
					>
						{' '}
					</Button>
				) : cell ? (
					<span style={{ ...pieceStyles, background: cell === 'W' ? 'white' : '#333', border: '1px solid black' }} />
				) : null}
			</td>
		);
	};

	return <Table<Turn | null> board={ctx.board} labels={{ row: '1-9', col: 'A-Z' }} Cell={Cell} />;
}

export function render(this: This, ctx: RenderCtx): ReactElement {
	return (
		<center>
			<h1 style={ctx.dimHeader ? { color: 'gray' } : {}}>{ctx.header}</h1>
			{renderBoard.bind(this)(ctx)}
		</center>
	);
}
