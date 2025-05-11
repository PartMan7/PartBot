import { type ReactElement, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Table } from '@/web/react/components/board';

import type { GameModel } from '@/database/games';
import type { Othello } from '@/ps/games/othello';
import type { CellRenderer } from '@/ps/games/render';
import type { SerializedInstance } from '@/types/common';

export type GameModelAPI = SerializedInstance<Omit<GameModel, 'winCtx'> & { winCtx: Othello['winCtx'] }>;

type OthelloLog = { action: 'play' | 'skip'; time: string; turn: 'W' | 'B'; ctx: [number, number] | null };

type Board = (null | 'W' | 'B')[][];
type GameState = { board: Board; sinceLast: number | null; at: Date; score: { W: number; B: number } };

const Cell: CellRenderer<'W' | 'B' | null> = ({ cell }) => (
	<td className="bg-green-600 border-collapse border border-primary leading-0">
		<span
			className="h-7 w-7 inline-block rounded-full m-0.5"
			style={{ backgroundColor: cell ? (cell === 'W' ? 'white' : 'black') : undefined }}
		/>
	</td>
);
const Board = memo(({ state }: { state: GameState }) => (
	<>
		<Table<'W' | 'B' | null> board={state.board} rowLabel="1-9" colLabel="A-Z" Cell={Cell} />
		<span className="text-secondary">
			{state.sinceLast
				? `Played after ${state.sinceLast / 1000}s.`
				: `Game started on ${state.at.toDateString()} at ${state.at.toLocaleTimeString()}.`}
		</span>
	</>
));

const BoardWrapper = memo(({ states, game }: { states: GameState[]; game: GameModelAPI }): ReactElement => {
	const [currentTurn, setCurrentTurn] = useState(0);
	const previous = useCallback(() => setCurrentTurn(turn => turn - 1), []);
	const canPrevious = currentTurn > 0;
	const next = useCallback(() => setCurrentTurn(turn => turn + 1), []);
	const canNext = currentTurn < states.length - 1;
	const start = useCallback(() => setCurrentTurn(0), []);
	const canStart = currentTurn !== 0;
	const end = useCallback(() => setCurrentTurn(states.length - 1), [states.length]);
	const canEnd = currentTurn !== states.length - 1;

	useEffect(() => {
		const keyboardControls = (e: KeyboardEvent) => {
			if (e.key === 'ArrowLeft' && canPrevious) previous();
			if (e.key === 'ArrowRight' && canNext) next();
		};
		window.addEventListener('keydown', keyboardControls);
		return () => window.removeEventListener('keydown', keyboardControls);
	}, [previous, canPrevious, next, canNext]);

	const state = states[currentTurn];

	const winCtx = game.winCtx;
	const subHeading = winCtx
		? winCtx.type === 'win'
			? `${winCtx.winner} won against ${winCtx.loser}.`
			: winCtx.type === 'draw'
				? `The game ended in a draw.`
				: winCtx.type === 'force'
					? 'Game ended due to a forfeit.'
					: winCtx.type === 'dq'
						? `Game ended due to a DQ.`
						: ':confused_noises: this is a weird game'
		: 'Uhhh I forgot to store who won; check for yourself please';

	const controls = (
		<p>
			<button onClick={start} disabled={!canStart}>
				Start
			</button>
			<button onClick={previous} disabled={!canPrevious}>
				Prev
			</button>
			<button onClick={next} disabled={!canNext}>
				Next
			</button>
			<button onClick={end} disabled={!canEnd}>
				End
			</button>
		</p>
	);

	return (
		<div className="flex flex-col items-center m-10">
			<h1>
				{game.players.B.name} (Black) vs {game.players.W.name} (White) <small className="text-secondary">in {game.room}</small>
			</h1>
			<h2 className="text-secondary">{subHeading}</h2>
			<br />
			<h2 className={currentTurn === 0 ? 'text-secondary' : ''}>{currentTurn === 0 ? 'Game start' : `Turn #${currentTurn}`}</h2>
			{controls}
			<Board state={state} />
			{controls}
			<b className="m-3">
				Score: {state.score.B} (Black) - {state.score.W} (White)
			</b>
		</div>
	);
});

function getInitialBoard(): Board {
	const board: Board = Array.from({ length: 8 }).map(() => Array.from({ length: 8 }).map(() => null));
	board[3][3] = board[4][4] = 'W';
	board[3][4] = board[4][3] = 'B';
	return board;
}

const cloneBoard = (toClone: Board): Board => toClone.map(row => row.slice());
function playOnBoard(board: Board, turn: 'W' | 'B', i: number, j: number) {
	const other = turn === 'W' ? 'B' : 'W';

	if (board[i][j]) return;

	for (let X = -1; X <= 1; X++) {
		for (let Y = -1; Y <= 1; Y++) {
			if (!X && !Y) continue;
			for (let m = i, n = j; m < 8 && n < 8 && m >= 0 && n >= 0; m += X, n += Y) {
				if (m === i && n === j) continue;
				if (!board[m][n]) break; // Gap
				if (board[m][n] === other) continue; // Continue flipping!
				for (let x = i, y = j; x < 8 && y < 8 && x >= 0 && y >= 0; x += X, y += Y) {
					if (x === i && y === j) continue;
					if (board[x][y] === other) {
						board[x][y] = turn;
					} else break;
				}
			}
		}
	}
	board[i][j] = turn;
}
const getScore = (board: Board): { W: number; B: number } =>
	board.flat().reduce(
		(acc, cell) => {
			if (cell) acc[cell]++;
			return acc;
		},
		{ W: 0, B: 0 }
	);

export const ViewOnlyOthello = memo(({ game }: { game: GameModelAPI }): ReactElement => {
	const log = useMemo(() => game.log.map<OthelloLog>(entry => JSON.parse(entry)), [game.log]);
	const boardsByTurn = useMemo(() => {
		return log.reduce<GameState[]>(
			(boards, entry) => {
				const lastState = boards.at(-1)!;
				const nextBoard = cloneBoard(lastState.board);
				if (entry.action === 'play') playOnBoard(nextBoard, entry.turn, ...entry.ctx!);
				const playedAt = new Date(entry.time);
				const nextState: GameState = {
					board: nextBoard,
					sinceLast: playedAt.getTime() - lastState.at.getTime(),
					at: playedAt,
					score: getScore(nextBoard),
				};
				boards.push(nextState);
				return boards;
			},
			[{ board: getInitialBoard(), sinceLast: null, at: new Date(game.started), score: { W: 0, B: 0 } }]
		);
	}, [log]);

	return <BoardWrapper states={boardsByTurn} game={game} />;
});
