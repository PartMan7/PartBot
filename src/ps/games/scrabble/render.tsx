import { Table } from '@/ps/games/render';
import { Button, Form, Username } from '@/utils/components/ps';
import { type Point, coincident } from '@/utils/grid';
import { log } from '@/utils/logger';

import type { CellRenderer } from '@/ps/games/render';
import type { Scrabble } from '@/ps/games/scrabble';
import type { Log } from '@/ps/games/scrabble/logs';
import type { BoardTile, Bonus, RenderCtx } from '@/ps/games/scrabble/types';
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { WIDE_LETTERS } from '@/ps/games/scrabble/constants';

export function renderMove(logEntry: Log, { id, players, $T, renderCtx: { msg } }: Scrabble): [ReactElement, { name: string }] {
	const Wrapper = ({ children }: { children: ReactNode }): ReactElement => (
		<>
			<hr />
			{children}
			<Button name="send" value={`${msg} watch`} style={{ float: 'right' }}>
				Watch!
			</Button>
			<hr />
		</>
	);

	const playerName = players[logEntry.turn]?.name;
	const opts = { name: `${id}-chatlog` };

	switch (logEntry.action) {
		case 'play':
			const words = Object.entries(logEntry.ctx.words);
			return [
				<Wrapper>
					<Username name={playerName} /> played{' '}
					{words.length === 1 && !logEntry.ctx.points.bingo
						? words[0][0]
						: words.map(([word, points]) => `${word} (${points})`).list($T)}{' '}
					for {logEntry.ctx.points.total} points!
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
		const buttonStyles: CSSProperties = {
			border: !isSelected ? 'none' : undefined,
			background: 'none',
			height: 20,
			width: 20,
		};
		const ButtonIfNeeded = clickable ? Button : 'div';
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
					<ButtonIfNeeded
						value={`${this.msg} ! s${encodePos([i, j])}`}
						style={{
							...buttonStyles,
							color: cell.blank ? '#333' : '#000',
							padding: 0,
							fontSize: 16,
							overflow: WIDE_LETTERS.includes(cell.letter) && cell.points ? 'hidden' : undefined,
						}}
					>
						<b>
							{cell.letter}
							{cell.points ? <sub style={{ fontSize: '0.6em' }}>{cell.points}</sub> : null}
						</b>
					</ButtonIfNeeded>
				) : null}
				{!cell && clickable ? (
					<Button
						value={`${this.msg} ! s${encodePos([i, j])}`}
						style={{
							...buttonStyles,
							...(baseCell === '2*'
								? {
										color: '#000',
										padding: 0,
										fontSize: 16,
										textAlign: 'center',
										lineHeight: '18px',
									}
								: {}),
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
		<Table<BoardTile | null> board={ctx.board} labels={null} Cell={Cell} style={{ background: '#220', borderCollapse: undefined }} />
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
		const username = <Username name={player.name} />;
		return (
			<div>
				{player.out ? <s>{username}</s> : username}: {player.score} ({player.rack} tile(s) in rack)
			</div>
		);
	});
}

function renderInput(this: This, ctx: RenderCtx): ReactElement | null {
	// ctx.selected is only passed for the active player
	if (!ctx.isActive) return null;
	return (
		<>
			{ctx.selected ? (
				<Form value={`${this.msg} ! p${encodePos(ctx.selected)}{dir} {word}`} style={{ display: 'inline-block', margin: '0 8px' }}>
					<center style={{ display: 'inline-block' }}>
						<input name="word" type="text" width="200" placeholder="Your word here" />
						<br />
						<div style={{ textAlign: 'left', margin: '4px 0' }}>
							<select name="dir">
								<option value="r">Right</option>
								<option value="d">Down</option>
							</select>
							<button style={{ float: 'right' }}>Go!</button>
						</div>
					</center>
				</Form>
			) : (
				<h3>Select a tile to play from!</h3>
			)}
			{
				<div style={{ display: 'inline-block' }}>
					<div style={{ textAlign: 'right' }}>
						<Button name="send" value={`${this.msg} ! -`}>
							Pass
						</Button>
					</div>
					<Form value={`${this.msg} ! x {tiles}`} style={{ margin: '4px 0' }}>
						<input name="tiles" placeholder="Exchange tiles" width="100" style={{ marginRight: 4 }} />
						<button>Exchange</button>
					</Form>
				</div>
			}
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
