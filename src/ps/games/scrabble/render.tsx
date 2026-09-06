import { getMsg } from '@/ps/games/game';
import { GameHeader, LogEntry, Table } from '@/ps/games/render';
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

export function renderMove(logEntry: Log, game: Scrabble): [ReactElement, { name: string }] {
	const playerName = game.players[logEntry.turn]?.name;
	const opts = { name: `${game.id}-chatlog` };

	switch (logEntry.action) {
		case 'play':
			const words = Object.entries(logEntry.ctx.words);
			return [
				<LogEntry>
					<Username name={playerName} clickable /> played{' '}
					{words.length === 1 && !logEntry.ctx.points.bingo
						? words[0][0]
						: words.map(([word, points]) => `${word} (${points})`).list(game.$T)}{' '}
					for {pluralize(logEntry.ctx.points.total, 'point', 'points')}!{logEntry.ctx.points.bingo ? ' BINGO!' : null}
				</LogEntry>,
				opts,
			];
		case 'exchange':
			return [
				<LogEntry>
					<Username name={playerName} clickable /> exchanged {pluralize(logEntry.ctx.tiles.length, 'tile', 'tiles')}.
				</LogEntry>,
				opts,
			];
		case 'pass':
			return [
				<LogEntry>
					<Username name={playerName} clickable /> passed.
				</LogEntry>,
				opts,
			];
		default:
			Logger.log('Scrabble had some weird move', logEntry, game.players);
			return [
				<LogEntry>
					Well <i>something</i> happened, I think! Someone go poke PartMan
				</LogEntry>,
				opts,
			];
	}
}

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

function renderBoard(ctx: RenderCtx) {
	const msg = getMsg();
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
						value={`${msg} ! s${encodePos([i, j])}`}
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
						value={`${msg} ! s${encodePos([i, j])}`}
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

export function render(ctx: RenderCtx): ReactElement {
	const msg = getMsg();
	return (
		<center>
			<GameHeader header={ctx.header} dimHeader={ctx.dimHeader} />
			{renderBoard(ctx)}
			{ctx.side ? (
				<>
					<UserPanel>
						<div style={{ color: '#000', display: 'inline-block' }}>
							{ctx.rack?.map(letter => <Letter letter={letter} points={ctx.getPoints(letter)} />)}
						</div>
						{ctx.isActive ? (
							<Button value={`${msg} ! -`} style={{ border: '2px solid darkred', borderRadius: 4, marginLeft: 24 }}>
								Pass
							</Button>
						) : null}
					</UserPanel>
					{ctx.isActive ? (
						<>
							<UserPanel>
								{ctx.selected ? (
									<Form
										value={`${msg} ! p${encodePos(ctx.selected)}{dir} {word}`}
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
												<button
													type="submit"
													style={{ float: 'right', fontWeight: 'bold', border: '2px solid green', borderRadius: 4 }}
												>
													Go!
												</button>
											</div>
										</center>
									</Form>
								) : (
									<h3>Select a tile to play from!</h3>
								)}
								<hr />
								<Form value={`${msg} ! x {tiles}`} style={{ margin: '4px 0' }}>
									<input name="tiles" placeholder="Exchange tiles" width="100" style={{ marginRight: 4 }} />
									<button type="submit">Exchange</button>
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
