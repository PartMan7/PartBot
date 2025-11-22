import { Dice, Table } from '@/ps/games/render';
import { createGrid } from '@/ps/games/utils';
import { Username } from '@/utils/components';
import { Button } from '@/utils/components/ps';

import type { RenderCtx } from '@/ps/games/azul/types';
import type { CellRenderer } from '@/ps/games/render';
import type { ReactElement } from 'react';

type This = { msg: string };

function Player({ color, as: As = 'td' }: { color: string; as?: 'td' | 'div' }): ReactElement {
	return (
		<As
			style={{
				borderRadius: 100,
				backgroundColor: color,
				height: 15,
				width: 15,
				opacity: 0.8,
				border: '1px solid #222',
				display: As === 'div' ? 'inline-block' : undefined,
			}}
		/>
	);
}

function Players({ players }: { players: { pos: number; color: string }[] }): ReactElement {
	return (
		<table>
			<tbody>
				<tr>
					{players.length === 1 ? <td style={{ width: 6 }} /> : null}
					{players.slice(0, 2).map(player => (
						<Player color={player.color} />
					))}
				</tr>
				{players.length > 2 ? (
					<tr>
						{players.slice(2).map(player => (
							<Player color={player.color} />
						))}
					</tr>
				) : null}
			</tbody>
		</table>
	);
}

const TEN_BY_TEN = createGrid<null>(10, 10, () => null);

export function renderBoard(this: This, ctx: RenderCtx) {
	const Cell: CellRenderer<null> = ({ i, j }) => {
		const displayNum = (10 - i - 1) * 10 + (i % 2 ? j + 1 : 10 - j);
		const players = Object.values(ctx.board).filter(player => player.pos === displayNum);

		return <td style={{ height: 45, width: 45 }}>{players.length ? <Players players={players} /> : null}</td>;
	};

	return (
		<Table<null>
			board={TEN_BY_TEN}
			labels={null}
			Cell={Cell}
			style={{
				backgroundImage: `url('${process.env.WEB_URL}/static/snakesladders/main.png')`,
				backgroundSize: 'cover',
				zoom: '75%',
			}}
		>
			<caption style={{ textAlign: 'right', color: '#555', padding: 4 }}>
				Art by <a href="https://cara.app/aurumii">Audiino</a>
			</caption>
		</Table>
	);
}

export function render(this: This, ctx: RenderCtx): ReactElement {
	return (
		<center>
			<h1 style={ctx.dimHeader ? { color: 'gray' } : {}}>{ctx.header}</h1>
			{renderBoard.bind(this)(ctx)}
			<b style={{ margin: 10 }}>
				{ctx.lastRoll ? (
					<>
						Last Roll: <Dice value={ctx.lastRoll} style={{ display: 'inline-block', zoom: '60%' }} />
						<br />
					</>
				) : null}
			</b>
			{ctx.active ? (
				<>
					<br />
					<Button value={`${this.msg} !`}>Roll!</Button>
				</>
			) : null}
			<br />
			<br />
			{ctx.turns
				.map(id => ctx.board[id])
				.map(player => (
					<>
						<Player color={player.color} as="div" /> <Username name={player.name} clickable />
					</>
				))
				.space(<br />)}
		</center>
	);
}
