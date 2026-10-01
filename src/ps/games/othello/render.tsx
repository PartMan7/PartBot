import { getGame } from '@/ps/games/game';
import { Table } from '@/ps/games/render';
import { Button } from '@/utils/components/ps';

import type { RenderCtx, Turn } from '@/ps/games/othello/types';
import type { CellRenderer } from '@/ps/games/render';
import type { ReactElement } from 'react';

const roundStyles = { height: 24, width: 24, display: 'inline-block', borderRadius: 100, marginLeft: 3, marginTop: 3 };

function renderBoard(ctx: RenderCtx) {
	const msg = getGame().msg;
	const Cell: CellRenderer<Turn | null> = ({ cell, i, j }) => {
		const action = ctx.validMoves.some(([x, y]) => x === i && y === j);
		return (
			<td style={{ height: 30, width: 30, background: 'green', borderCollapse: 'collapse', border: '1px solid black' }}>
				{cell ? (
					<span style={{ ...roundStyles, background: cell === 'W' ? 'white' : 'black' }} />
				) : action ? (
					<Button value={`${msg} play ${i}-${j}`} style={{ ...roundStyles, border: '1px dashed black', background: '#6666' }}>
						{' '}
					</Button>
				) : null}
			</td>
		);
	};

	return <Table<Turn | null> board={ctx.board} labels={{ row: '1-9', col: 'A-Z' }} Cell={Cell} />;
}

export function render(ctx: RenderCtx): ReactElement {
	return (
		<>
			{renderBoard(ctx)}
			<b style={{ margin: 10 }}>
				Score: {ctx.score.B}/{ctx.score.W}
			</b>
		</>
	);
}
