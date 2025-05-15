import { Table } from '@/ps/games/render';
import { Button, Username } from '@/utils/components/ps';
import { type Point, coincident } from '@/utils/grid';

import type { CellRenderer } from '@/ps/games/render';
import type { BoardTile, Bonus, RenderCtx } from '@/ps/games/scrabble/types';
import type { ReactElement } from 'react';

type This = { msg: string };

const LETTER_HEX = '#dc6';

function encodePos([x, y]: Point): string {
	return [x, y]
		.map(coord => coord.toString(36))
		.join('')
		.toUpperCase();
}

function getBackgroundHex(bonus: Bonus | null): string {
	switch (bonus) {
		case '2*':
		case '2W':
			return '#fba';
		case '2L':
			return '#bcd';
		case '3W':
			return '#f65';
		case '3L':
			return '#59a';
		default:
			return '#cca';
	}
}

export function renderBoard(this: This, ctx: RenderCtx) {
	const Cell: CellRenderer<BoardTile | null> = ({ cell, i, j }): ReactElement => {
		const baseCell = ctx.baseBoard[i][j];
		const isSelected = !!ctx.selected && coincident([i, j], ctx.selected);
		return (
			<td style={{ height: 20, width: 20, background: getBackgroundHex(baseCell) }}>
				{cell ? (
					<span style={{ color: cell.blank ? 'grey' : '#000', padding: 0 }}>
						<b>
							{cell.letter}
							{cell.points ? <sub style={{ fontSize: '0.4em' }}>{cell.points}</sub> : null}
						</b>
					</span>
				) : null}
				{!cell ? (
					<Button
						value={`${this.msg} ! ${ctx.id},s${encodePos([i, j])}`}
						style={{ color: '#000', border: 'none', background: 'none', ...(isSelected ? {} : {}) }} // TODO handle selected styles
					>
						{baseCell === '2*' ? '★' : ' '}
					</Button>
				) : null}
			</td>
		);
	};

	return <Table<BoardTile | null> board={ctx.board} labels={null} Cell={Cell} style={{ fontSize: 16, border: 2 }} />;
}

function Letter({ letter, points }: { letter: string; points: number }): ReactElement {
	return (
		<span style={{ background: LETTER_HEX }}>
			{letter}
			{points ? <sub style={{ fontSize: '0.4em' }}>{points}</sub> : null}
		</span>
	);
}

function Scores({ players }: { players: RenderCtx['players'] }): ReactElement {
	return (
		<div style={{ padding: 8, border: '1px solid' }}>
			{Object.values(players).map(player => {
				return (
					<div>
						<Username name={player.name} />: {player.score}p ({player.rack} tiles)
					</div>
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
			<div style={{ color: '#000' }}>{ctx.rack?.map(letter => <Letter letter={letter} points={ctx.getPoints(letter)} />)}</div>
			<Scores players={ctx.players} />
		</center>
	);
}
