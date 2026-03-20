import { getMsg } from '@/ps/games/game';
import { GameHeader } from '@/ps/games/render';
import { Button } from '@/utils/components/ps';
import { repeat } from '@/utils/repeat';

import type { RenderCtx, Turn } from '@/ps/games/connectfour/types';
import type { ReactElement } from 'react';

function getColor(cell: Turn | null): string {
	if (cell === 'Y') return '#ff0';
	if (cell === 'R') return '#e00';
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
function renderBoard(ctx: RenderCtx): ReactElement {
	const msg = getMsg();
	return (
		<div style={{ backgroundColor: '#0080ff', borderRadius: 16, display: 'inline-block', padding: 2 }}>
			{repeat(null, ctx.board[0].length).map((_, col) => {
				const column = ctx.board.map(row => row[col]);
				return column[0] ? (
					<div style={{ display: 'inline-block' }}>
						<Column data={column} />
					</div>
				) : (
					<Button value={`${msg} ! ${col}`} style={{ background: 'none', border: 'none', padding: 0 }}>
						<Column data={column} />
					</Button>
				);
			})}
		</div>
	);
}

export function render(ctx: RenderCtx): ReactElement {
	return (
		<center>
			<GameHeader header={ctx.header} dimHeader={ctx.dimHeader} />
			{renderBoard(ctx)}
		</center>
	);
}
