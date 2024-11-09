import type { RenderCtx, Turn } from '@/ps/games/othello/types';
import { CellRenderer, Table } from '@/ps/games/render';

const roundStyles = { height: 24, width: 24, display: 'inline-block', borderRadius: 100, marginLeft: 3 };

type This = { msg: string };

export function renderBoard(this: This, ctx: RenderCtx) {
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
}

export function render(this: This, ctx: RenderCtx) {
	return (
		<center>
			<h1 style={ctx.headerStyles}>{ctx.header}</h1>
			{renderBoard.bind(this)(ctx)}
			<b style={{ margin: '10px' }}>
				Score: {ctx.score.B}/{ctx.score.W}
			</b>
		</center>
	);
}
