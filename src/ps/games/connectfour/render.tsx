import { getGame } from '@/ps/games/game';
import { Button } from '@/utils/components/ps';
import { repeat } from '@/utils/repeat';

import type { DiscStyle, RenderCtx, Turn } from '@/ps/games/connectfour/types';
import type { ReactElement } from 'react';

function Column({ data, discs }: { data: (Turn | null)[]; discs: Record<Turn, DiscStyle> }): ReactElement {
	return (
		<>
			{data.map(cell => (
				<div
					style={
						cell
							? {
									height: 35,
									width: 35,
									borderRadius: '50%',
									margin: 3,
									backgroundColor: discs[cell].bgHex,
									backgroundImage: `url(${discs[cell].imageUrl})`,
									backgroundPosition: 'center',
									backgroundRepeat: 'no-repeat',
									backgroundSize: '80%',
								}
							: {
									height: 35,
									width: 35,
									borderRadius: '50%',
									margin: 3,
									backgroundImage: 'radial-gradient(#111 50%, #333)',
									backgroundPosition: 'center',
									backgroundRepeat: 'no-repeat',
								}
					}
				/>
			))}
		</>
	);
}
function renderBoard(ctx: RenderCtx): ReactElement {
	const game = getGame();
	return (
		<div style={{ backgroundColor: '#0080ff', borderRadius: 16, display: 'inline-block', padding: 2 }}>
			{repeat(null, ctx.board[0].length).map((_, col) => {
				const column = ctx.board.map(row => row[col]);
				return game.winCtx || column[0] ? (
					<div style={{ display: 'inline-block' }}>
						<Column data={column} discs={ctx.discs} />
					</div>
				) : (
					<Button value={`${game.msg} ! ${col}`} style={{ background: 'none', border: 'none', padding: 0 }}>
						<Column data={column} discs={ctx.discs} />
					</Button>
				);
			})}
		</div>
	);
}

export function render(ctx: RenderCtx): ReactElement {
	return renderBoard(ctx);
}
