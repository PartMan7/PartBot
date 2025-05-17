import { Table } from '@/ps/games/render';
import { Button, Form, Username } from '@/utils/components/ps';
import { type Point, coincident } from '@/utils/grid';
import { log } from '@/utils/logger';

import type { TranslationFn } from '@/i18n/types';
import type { Player } from '@/ps/games/common';
import type { CellRenderer } from '@/ps/games/render';
import type { Log } from '@/ps/games/scrabble/logs';
import type { BoardTile, Bonus, RenderCtx } from '@/ps/games/scrabble/types';
import type { ReactElement, ReactNode } from 'react';

export function renderMove(
	logEntry: Log,
	{ id, players, $T }: { id: string; players: Record<string, Player>; $T: TranslationFn }
): [ReactElement, { name: string }] {
	const Wrapper = ({ children }: { children: ReactNode }): ReactElement => (
		<>
			<hr />
			{children}
			<hr />
		</>
	);

	const playerName = players[logEntry.turn]?.name;
	const opts = { name: `${id}-chatlog` };

	switch (logEntry.action) {
		case 'play':
			return [
				<Wrapper>
					<Username name={playerName} /> played {logEntry.ctx.words.list($T)} for {logEntry.ctx.points.total} points!
					{logEntry.ctx.points.bingo ? ' BINGO!' : null}
				</Wrapper>,
				opts,
			];
		case 'exchange':
			return [
				<Wrapper>
					<Username name={playerName} /> exchanged {logEntry.ctx.tiles.length} tiles.
				</Wrapper>,
				opts,
			];
		case 'pass':
			return [
				<Wrapper>
					<Username name={playerName} /> passed.
				</Wrapper>,
				opts,
			];
		default:
			log('Scrabble had some weird move', logEntry, players);
			return [
				<Wrapper>
					Well <i>something</i> happened, I think! Someone go poke PartMan
				</Wrapper>,
				opts,
			];
	}
}

type This = { msg: string };

const LETTER_HEX = '#da5';
const BASE_MARGIN = 12;
const BASE_PADDING = 8;

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
			return '#ecc';
		case '2L':
			return '#bdd';
		case '3W':
			return '#e65';
		case '3L':
			return '#49a';
		default:
			return '#cca';
	}
}

function renderBoard(this: This, ctx: RenderCtx) {
	const clickable = !!ctx.side && ctx.side === ctx.turn;
	const Cell: CellRenderer<BoardTile | null> = ({ cell, i, j }): ReactElement => {
		const baseCell = ctx.baseBoard[i][j];
		const isSelected = !!ctx.selected && coincident([i, j], ctx.selected);
		return (
			<td
				style={{
					height: 20,
					width: 20,
					background: cell ? LETTER_HEX : getBackgroundHex(baseCell),
					textAlign: cell ? 'center' : undefined,
				}}
			>
				{cell ? (
					<Button
						value={`${this.msg} ! ${ctx.id},s${encodePos([i, j])}`}
						style={{
							color: cell.blank ? 'grey' : '#000',
							padding: 0,
							border: !isSelected ? 'none' : undefined,
							background: 'none',
							height: 20,
							width: 20,
							fontSize: 16,
						}}
					>
						<b>
							{cell.letter}
							{cell.points ? <sub style={{ fontSize: '0.6em' }}>{cell.points}</sub> : null}
						</b>
					</Button>
				) : null}
				{!cell && clickable ? (
					<Button
						value={`${this.msg} ! ${ctx.id},s${encodePos([i, j])}`}
						style={{
							border: !isSelected ? 'none' : undefined,
							background: 'none',
							height: 20,
							width: 20,
							fontSize: 16,
							...(baseCell === '2*' ? { color: '#000', padding: 0, lineHeight: '15px' } : {}),
						}}
					>
						{baseCell === '2*' ? '★' : ' '}
					</Button>
				) : null}
				{!cell && !clickable && baseCell === '2*' ? (
					<div style={{ color: '#000', height: 20, width: 20, padding: 0, lineHeight: '15px' }}>★</div>
				) : null}
			</td>
		);
	};

	return (
		<Table<BoardTile | null> board={ctx.board} labels={null} Cell={Cell} style={{ background: '#dde', borderCollapse: undefined }} />
	);
}

function Letter({ letter, points }: { letter: string; points: number }): ReactElement {
	return (
		<b
			style={{
				display: 'inline-block',
				background: LETTER_HEX,
				height: 22,
				width: 20,
				lineHeight: '20px',
				margin: 4,
			}}
		>
			{letter}
			{points ? <sub style={{ fontSize: '0.6em' }}>{points}</sub> : null}
		</b>
	);
}

function Scores({ players }: { players: RenderCtx['players'] }): ReactElement[] {
	return Object.values(players).map(player => {
		return (
			<div>
				<Username name={player.name} />: {player.score}p ({player.rack} tiles in rack)
			</div>
		);
	});
}

function renderInput(this: This, ctx: RenderCtx): ReactElement | null {
	// ctx.selected is only passed for the active player
	if (!ctx.selected) {
		if (ctx.side && ctx.side === ctx.turn) return <h3>Select a tile to play from.</h3>;
		return null;
	}
	return (
		<>
			<br />
			<Form value={`${this.msg} ! ${ctx.id},p${encodePos(ctx.selected)}{dir} {word}`}>
				<center style={{ display: 'inline-block' }}>
					<input name="word" type="text" width="200" placeholder="Your word here" />
					<br />
					<button>Play!</button>
				</center>
				<div style={{ display: 'inline-block' }}>
					<label>
						<input type="radio" name="dir" value="r" style={{ position: 'relative', top: 2 }} required checked />
						Right
					</label>
					<br />
					<label>
						<input type="radio" name="dir" value="d" style={{ position: 'relative', top: 2 }} />
						Down
					</label>
				</div>
			</Form>
		</>
	);
}

function InfoPanel({ bag }: { bag: number }): string {
	return bag ? `${bag} tile(s) left in bag.` : 'Empty bag.';
}

export function render(this: This, ctx: RenderCtx): ReactElement {
	return (
		<center>
			<h1 style={ctx.dimHeader ? { color: 'gray' } : {}}>{ctx.header}</h1>
			{renderBoard.bind(this)(ctx)}
			{ctx.side ? (
				<center style={{ margin: BASE_MARGIN, padding: BASE_PADDING, border: '1px solid' }}>
					<div style={{ color: '#000' }}>{ctx.rack?.map(letter => <Letter letter={letter} points={ctx.getPoints(letter)} />)}</div>
					{renderInput.bind(this)(ctx)}
				</center>
			) : null}
			<div style={{ margin: BASE_MARGIN, padding: BASE_PADDING, border: '1px solid' }}>
				<InfoPanel bag={ctx.bag} />
				<Scores players={ctx.players} />
			</div>
		</center>
	);
}
