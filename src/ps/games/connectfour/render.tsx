import { Button } from '@/utils/components/ps';
import { repeat } from '@/utils/repeat';

import type { RenderCtx, Turn } from '@/ps/games/connectfour/types';
import type { ReactElement } from 'react';

type This = { msg: string };
function getColor(cell: Turn | null): string {
	if (cell === 'Y') return '#FF0';
	if (cell === 'R') return '#E00';
	return '#111';
}
function Column({ data }: { data: (Turn | null)[] }): ReactElement {
	return (
		<>
			{data.map(cell => (
				<div
					style={{
						height: 35,
						width: 35,
						borderRadius: '50%',
						margin: 3,
						backgroundImage: `radial-gradient(${getColor(cell)} 50%, #333)`,
					}}
				/>
			))}
		</>
	);
}
function renderBoard(this: This, ctx: RenderCtx): ReactElement {
	return (
		<div style={{ backgroundColor: '#0080FF', borderRadius: 16, display: 'inline-block', padding: 2 }}>
			{repeat(null, ctx.board[0].length).map((_, col) => {
				const column = ctx.board.map(row => row[col]);
				return column[0] ? (
					<div style={{ display: 'inline-block' }}>
						<Column data={column} />
					</div>
				) : (
					<Button value={`${this.msg} play ${col}`} style={{ background: 'none', border: 'none', padding: 0 }}>
						<Column data={column} />
					</Button>
				);
			})}
		</div>
	);
}

export function render(this: This, ctx: RenderCtx): ReactElement {
	return (
		<center>
			<h1 style={ctx.dimHeader ? { color: 'gray' } : {}}>{ctx.header}</h1>
			{renderBoard.bind(this)(ctx)}
		</center>
	);
}
