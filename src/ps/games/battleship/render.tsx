import { SHIP_DATA, Ships } from '@/ps/games/battleship/constants';
import { getMsg } from '@/ps/games/game';
import { type CellRenderer, GameHeader, LogEntry, Table } from '@/ps/games/render';
import { createGrid } from '@/ps/games/utils';
import { Username } from '@/utils/components';
import { Button, Form } from '@/utils/components/ps';
import { pointToA1 } from '@/utils/grid';
import { Logger } from '@/utils/logger';

import type { ShipType } from '@/ps/games/battleship/constants';
import type { Battleship } from '@/ps/games/battleship/index';
import type { Log } from '@/ps/games/battleship/logs';
import type {
	AttackBoard,
	NotSetSelectionState,
	RenderCtx,
	SelectionErrorState,
	SelectionInProgressState,
	ShipBoard,
	State,
	Turn,
	WinCtx,
} from '@/ps/games/battleship/types';
import type { EndType, Player } from '@/ps/games/types';
import type { ReactElement } from 'react';

const EMPTY_BOARD: null[][] = createGrid(10, 10, () => null);

export function renderMove(logEntry: Log, game: Battleship): [ReactElement, { name: string }] {
	const playerName = game.players[logEntry.turn]?.name;
	const opts = { name: `${game.id}-chatlog` };

	switch (logEntry.action) {
		case 'set':
			return [
				<LogEntry game={game}>
					<Username name={playerName} clickable /> set their ships!
				</LogEntry>,
				opts,
			];
		case 'hit':
			return [
				<LogEntry game={game}>
					<Username name={playerName} clickable /> hit the enemy {logEntry.ctx.ship}!
				</LogEntry>,
				opts,
			];
		case 'miss':
			return [
				<LogEntry game={game}>
					<Username name={playerName} clickable /> missed.
				</LogEntry>,
				opts,
			];
		default:
			Logger.log('Battleship had some weird move', logEntry, game.players);
			return [
				<LogEntry game={game}>
					Well <i>something</i> happened, I think! Someone go poke PartMan
				</LogEntry>,
				opts,
			];
	}
}

function ShipGrid({
	boards,
	clickable,
}: {
	boards: AttackBoard | { defense: AttackBoard; ships: ShipBoard };
	clickable?: boolean;
}): ReactElement {
	const showHitsAsShips = clickable;
	const missiles = !Array.isArray(boards) ? boards.defense : boards;
	const ships = !Array.isArray(boards) ? boards.ships : EMPTY_BOARD;

	const Cell: CellRenderer<ShipType | null> = ({ cell: ship, i, j }) => {
		const hitData = missiles.access([i, j]);
		const shipData = ship ?? hitData;
		const isHit = hitData === false ? false : hitData ? true : null;

		return (
			<td
				style={{
					lineHeight: 0,
					textAlign: 'center',
					fontWeight: 'bold',
					height: 20,
					width: 20,
					background: shipData ? '#555' : '#01AAD6',
					color: isHit ? 'red' : undefined,
					...(!shipData ? { border: '1px solid white' } : {}),
				}}
			>
				{typeof isHit === 'boolean' && !(showHitsAsShips && isHit) ? (
					<div style={{ background: isHit ? 'red' : 'white', borderRadius: 9, width: 13, height: 13, marginLeft: 4 }}>
						<div
							style={{
								background: 'black',
								opacity: 0.4,
								borderRadius: 5,
								width: 7,
								height: 7,
								left: 3,
								top: 3,
								position: 'relative',
							}}
						/>
					</div>
				) : shipData ? (
					SHIP_DATA[shipData].symbol
				) : clickable ? (
					<Button
						value={`${getMsg()} ! hit ${pointToA1([i, j])}`}
						style={{ border: 'none', background: 'none', height: 23, width: 23, margin: 0 }}
					/>
				) : null}
			</td>
		);
	};

	return <Table board={ships} labels={{ row: 'A-Z', col: '1-9' }} Cell={Cell} style={{ fontSize: '0.8em', color: 'white' }} />;
}

function ShipInput({ filled }: { filled?: string[] | null }): ReactElement {
	const msg = getMsg();
	const cloned = filled?.slice();
	return (
		<Form
			value={`${msg} ! set ${Ships.map(ship => ship.symbol)
				.map(s => `{${s}1}-{${s}2}`)
				.join('|')}`}
		>
			{Ships.map((ship, index) => {
				const row = (index + 1).toLetter();
				return (
					<div>
						<b style={{ width: 100, display: 'inline-block', textAlign: 'right' }}>{ship.name}</b>
						{': '}
						<input name={`${ship.symbol}1`} style={{ width: 40 }} placeholder={`${row}1`} value={cloned?.shift() ?? ''} />
						{' - '}
						<input name={`${ship.symbol}2`} style={{ width: 40 }} placeholder={`${row}${ship.size}`} value={cloned?.shift() ?? ''} />
					</div>
				);
			})}
			<br />
			<center>
				<button type="submit">Go!</button>
			</center>
		</Form>
	);
}

export function renderSelection(
	ctx: SelectionInProgressState | SelectionErrorState | NotSetSelectionState,
	locked?: boolean
): ReactElement {
	const msg = getMsg();
	const { $T } = ctx;
	const input = ctx.type !== 'not-set' ? ctx.input : null;
	const error = ctx.type === 'invalid' ? ctx.message : null;

	return (
		<center>
			<div>
				<h1 style={locked ? { color: 'gray' } : {}}>
					{locked ? $T('GAME.BATTLESHIP.WAITING_FOR_OPPONENT') : $T('GAME.BATTLESHIP.SET_YOUR_SHIPS')}
				</h1>
				<ShipGrid boards={ctx?.type === 'valid' ? { defense: EMPTY_BOARD, ships: ctx.board } : EMPTY_BOARD} />
				{error ? <h3>{error}</h3> : null}
				{!locked ? (
					<>
						{input ? (
							<>
								<Button value={`${msg} ! confirm-set`}>Confirm</Button>
								<br />
								<details style={{ textAlign: 'left', width: 300 }}>
									<summary>Input</summary>
									<hr />
									<ShipInput filled={input} />
								</details>
							</>
						) : (
							<ShipInput filled={input} />
						)}
					</>
				) : null}
			</div>
		</center>
	);
}

export function renderSummary(ctx: {
	boards: State['board'];
	players: Record<string, Player>;
	winCtx: WinCtx | { type: EndType };
}): ReactElement {
	return (
		<center>
			<p>
				{ctx.winCtx.type === 'win' ? (
					<>
						<Username name={ctx.winCtx.winner.name} /> won!
					</>
				) : (
					'The game was ended.'
				)}
			</p>
			{Object.values(ctx.players).map(player => (
				<div style={{ display: 'inline-block' }}>
					{/* ToTranslate */}
					<Username name={player.name} clickable />
					's ships
					<br />
					<br />
					<ShipGrid
						boards={{ defense: ctx.boards.attacks[player.turn === 'A' ? 'B' : 'A'], ships: ctx.boards.ships[player.turn as Turn] }}
					/>
				</div>
			))}
		</center>
	);
}

export function render(ctx: RenderCtx): ReactElement {
	return (
		<center>
			<GameHeader header={ctx.header} dimHeader={ctx.dimHeader} />
			{ctx.type === 'player' ? (
				<div>
					<ShipGrid boards={ctx.attack} clickable />
					<ShipGrid boards={{ defense: ctx.defense, ships: ctx.actual }} />
				</div>
			) : (
				<>
					<div>
						<Username name={ctx.players.A.name} clickable />
						's ships
						<ShipGrid boards={ctx.boards.A} />
					</div>
					<div>
						<Username name={ctx.players.B.name} clickable />
						's ships
						<ShipGrid boards={ctx.boards.B} />
					</div>
				</>
			)}
		</center>
	);
}
