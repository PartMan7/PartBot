import type { RenderCtx, Turn } from '@/ps/games/othello/types';
import { CellRenderer, Table } from '@/ps/games/render';

const roundStyles = { height: 24, width: 24, display: 'inline-block', borderRadius: 100, marginLeft: 3 };

export const render = function (this: { msg: string }, ctx: RenderCtx) {
	const Cell: CellRenderer<Turn | null> = ({ cell, i, j }) => {
		const action = ctx.validMoves.some(([x, y]) => x === i && y === j);
		return (
			<td style={{ height: 30, width: 30, background: 'green', borderCollapse: 'collapse', border: '1px solid black' }}>
				{cell ? (
					<span style={{ ...roundStyles, background: cell === 'W' ? 'white' : 'black' }} />
				) : action ? (
					<button
						name="send"
						value={`${this.msg} play ${i},${j}`}
						style={{ ...roundStyles, border: '1px dashed black', background: '#6666' }}
					/>
				) : null}
			</td>
		);
	};

	return <Table<Turn | null> board={ctx.board} rowLabel="1-9" colLabel="A-Z" Cell={Cell} />;
};
