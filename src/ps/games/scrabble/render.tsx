import { Table } from '@/ps/games/render';
import { RACK_SIZE, WIDE_LETTERS } from '@/ps/games/scrabble/constants';
import { Button, Form, Username } from '@/utils/components/ps';
import { type Point, coincident } from '@/utils/grid';
import { Logger } from '@/utils/logger';
import { pluralize } from '@/utils/pluralize';

import type { CellRenderer } from '@/ps/games/render';
import type { Scrabble } from '@/ps/games/scrabble';
import type { Log } from '@/ps/games/scrabble/logs';
import type { BoardTile, Bonus, RenderCtx } from '@/ps/games/scrabble/types';
import type { CSSProperties, ReactElement, ReactNode } from 'react';

// Do NOT use \u2605 for cross-browser reasons
const STAR = '⭑';

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
			Logger.log('Scrabble had some weird move', logEntry, players);
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
			padding: 0,
		};
		const ButtonIfNeeded = clickable ? Button : 'div';
		return (
			<td
				style={{
					height: 20,
					width: 20,
					lineHeight: !cell ? 0 : undefined,
					background: cell ? LETTER_HEX : getBackgroundHex(baseCell),
					textAlign: cell ? 'center' : undefined,
				}}
			>
				{cell ? (
					<ButtonIfNeeded
						value={`${this.msg} ! s${encodePos([i, j])}`}
						style={{
							...buttonStyles,
							fontFamily: clickable ? 'inherit' : undefined,
							color: cell.blank ? '#444' : '#000',
							fontSize: 16,
							overflow: WIDE_LETTERS.includes(cell.letter) && cell.points ? 'hidden' : undefined,
						}}
					>
						<b style={{ whiteSpace: 'nowrap' }}>
							{cell.letter}
							{<sub style={{ fontSize: '0.4em' }}>{cell.points}</sub>}
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
										fontSize: 18,
										textAlign: 'center',
										lineHeight: '18px',
									}
								: {}),
						}}
					>
						{baseCell === '2*' ? STAR : ' '}
					</Button>
				) : null}
				{!cell && !clickable && baseCell === '2*' ? (
					<div style={{ color: '#000', height: 20, width: 20, lineHeight: '20px', textAlign: 'center', fontSize: 18, marginTop: -2 }}>
						{STAR}
					</div>
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
		<div
			style={{
				background: LETTER_HEX,
				color: 'black',
				textAlign: 'center',
				padding: 0,
				display: 'inline-block',
				margin: 4,
				height: 20,
				minWidth: 20,
				maxWidth: 20,
				overflow: 'hidden',
			}}
		>
			<b style={{ fontSize: 14, whiteSpace: 'nowrap' }}>
				{letter === '_' ? '\u00A0\u00A0' : letter}
				<sub style={{ fontSize: '0.5em' }}>{points ?? 0}</sub>
			</b>
		</div>
	);
}

function Scores({ players }: { players: RenderCtx['players'] }): ReactElement[] {
	return Object.values(players).map(player => {
		const username = <Username name={player.name} />;
		return (
			<div>
				{player.out ? <s>{username}</s> : username}: {player.score}
				{player.rack !== RACK_SIZE ? <> ({player.rack} tile(s) in rack)</> : null}
			</div>
		);
	});
}

function UserPanel({ children }: { children: ReactNode }): ReactElement {
	return (
		<div style={{ width: 320, backgroundColor: '#5552', border: '1px solid', borderRadius: 4, padding: '12px 16px', margin: 8 }}>
			{children}
		</div>
	);
}

export function render(this: This, ctx: RenderCtx): ReactElement {
	return (
		<center>
			<h1 style={ctx.dimHeader ? { color: 'gray' } : {}}>{ctx.header}</h1>
			{renderBoard.bind(this)(ctx)}
			{ctx.side ? (
				<>
					<UserPanel>
						<div style={{ color: '#000', display: 'inline-block' }}>
							{ctx.rack?.map(letter => <Letter letter={letter} points={ctx.getPoints(letter)} />)}
						</div>
						{ctx.isActive ? (
							<Button value={`${this.msg} ! -`} style={{ border: '2px solid darkred', borderRadius: 4, marginLeft: 24 }}>
								Pass
							</Button>
						) : null}
					</UserPanel>
					{ctx.isActive ? (
						<>
							<UserPanel>
								{ctx.selected ? (
									<Form
										value={`${this.msg} ! p${encodePos(ctx.selected)}{dir} {word}`}
										style={{ display: 'inline-block', margin: '0 8px' }}
									>
										<center style={{ display: 'inline-block' }}>
											<input name="word" type="text" placeholder="Your word here" style={{ width: 300 }} />
											<br />
											<div style={{ textAlign: 'left', margin: '4px 0' }}>
												<label style={{ fontSize: '0.8em' }}>
													<input type="radio" name="dir" value="r" checked />
													<span style={{ position: 'relative', top: -2 }}>Right</span>
												</label>
												<label style={{ fontSize: '0.8em' }}>
													<input type="radio" name="dir" value="d" />
													<span style={{ position: 'relative', top: -2 }}>Down</span>
												</label>
												<button style={{ float: 'right', fontWeight: 'bold', border: '2px solid green', borderRadius: 4 }}>Go!</button>
											</div>
										</center>
									</Form>
								) : (
									<h3>Select a tile to play from!</h3>
								)}
								<hr />
								<Form value={`${this.msg} ! x {tiles}`} style={{ margin: '4px 0' }}>
									<input name="tiles" placeholder="Exchange tiles" width="100" style={{ marginRight: 4 }} />
									<button>Exchange</button>
								</Form>
							</UserPanel>
						</>
					) : null}
				</>
			) : null}
			<UserPanel>
				<Scores players={ctx.players} />
				<hr />
				Bag: {pluralize(ctx.bag, 'tile', 'tiles')}
			</UserPanel>
		</center>
	);
}
