import { ALL_PIECE_IDS, BOARD_SIZE, PIECES } from '@/ps/games/blokus/constants';
import { render } from '@/ps/games/blokus/render';
import { BaseGame } from '@/ps/games/game';
import { createGrid } from '@/ps/games/utils';
import { ChatError } from '@/utils/chatError';
import { deepClone } from '@/utils/deepClone';

import type { TranslatedText } from '@/i18n/types';
import type { PieceId } from '@/ps/games/blokus/constants';
import type { Log } from '@/ps/games/blokus/logs';
import type { RenderCtx, State, Turn, WinCtx } from '@/ps/games/blokus/types';
import type { BaseContext } from '@/ps/games/game';
import type { ActionResponse, EndType } from '@/ps/games/types';
import type { User } from 'ps-client';

export { meta } from '@/ps/games/blokus/meta';

const CARDINAL: [number, number][] = [
	[-1, 0],
	[1, 0],
	[0, -1],
	[0, 1],
];
const DIAGONAL: [number, number][] = [
	[-1, -1],
	[-1, 1],
	[1, -1],
	[1, 1],
];

export class Blokus extends BaseGame<State> {
	log: Log[] = [];
	declare winCtx?: WinCtx | { type: EndType };

	selectedPiece: PieceId | null = null;
	selectedOrient: number | null = null;

	constructor(ctx: BaseContext) {
		super(ctx);
		super.persist(ctx);

		if (ctx.backup) return;

		this.state.size = 20;
		this.state.board = createGrid<Turn | null>(20, 20, () => null);
		this.state.playerIndex = {};
		this.state.pieces = {};
		this.state.placed = {};
	}

	onStart(): { success: true; data: null } {
		const turns = Object.keys(this.players);
		const size = turns.length === 2 ? BOARD_SIZE.two : BOARD_SIZE.many;
		this.state.size = size;
		this.state.board = createGrid<Turn | null>(size, size, () => null);
		this.state.playerIndex = Object.fromEntries(turns.map((turn, i) => [turn, i]));
		this.state.pieces = Object.fromEntries(turns.map(turn => [turn, [...ALL_PIECE_IDS]]));
		this.state.placed = Object.fromEntries(turns.map(turn => [turn, false]));
		return { success: true, data: null };
	}

	onReplacePlayer(turn: Turn, withPlayer: User): ActionResponse<null> {
		const newTurn = withPlayer.id;
		this.state.pieces[newTurn] = this.state.pieces[turn];
		this.state.placed[newTurn] = this.state.placed[turn];
		this.state.playerIndex[newTurn] = this.state.playerIndex[turn];
		this.state.board.forEach(row =>
			row.forEach((cell, index) => {
				if (cell === turn) row[index] = newTurn;
			})
		);
		delete this.state.pieces[turn];
		delete this.state.placed[turn];
		delete this.state.playerIndex[turn];
		return { success: true, data: null };
	}

	action(user: User, ctx: string): void {
		if (!this.started) this.throw('GAME.NOT_STARTED');
		if (user.id !== this.players[this.turn!].id) this.throw('GAME.IMPOSTOR_ALERT');

		const [actionType, action] = ctx.lazySplit(' ', 1);
		switch (actionType) {
			case 'select':
				this.selectPiece(action);
				break;
			case 'orient':
				this.selectOrient(parseInt(action));
				break;
			case 'place':
				this.place(action);
				break;
			default:
				this.throw();
		}
	}

	clearSelection() {
		this.selectedPiece = null;
		this.selectedOrient = null;
	}

	selectPiece(pieceId: string) {
		const turn = this.turn!;
		if (!this.state.pieces[turn].includes(pieceId as PieceId)) this.throw();
		if (this.selectedPiece === pieceId) {
			this.clearSelection();
		} else {
			this.selectedPiece = pieceId as PieceId;
			this.selectedOrient = PIECES[this.selectedPiece].orientations.length === 1 ? 0 : null;
		}
		this.update(this.players[turn].id);
	}

	selectOrient(index: number) {
		if (!this.selectedPiece || isNaN(index)) this.throw();
		const orientations = PIECES[this.selectedPiece].orientations;
		if (index < 0 || index >= orientations.length) this.throw();
		if (!this.getValidAnchors(this.turn!, this.selectedPiece, index).length)
			throw new ChatError(this.$T('GAME.BLOKUS.NO_VALID_ORIENTATION'));
		this.selectedOrient = index;
		this.update(this.players[this.turn!].id);
	}

	place(ctx: string) {
		if (!this.selectedPiece) this.throw();
		const [orientPart, coords] = ctx.lazySplit(' ', 1);
		const orientIndex = parseInt(orientPart);
		const [i, j] = coords.split('-').map(n => parseInt(n));
		if (isNaN(orientIndex) || isNaN(i) || isNaN(j)) this.throw();

		const turn = this.turn!;
		const orientations = PIECES[this.selectedPiece].orientations;
		if (orientIndex < 0 || orientIndex >= orientations.length) this.throw();
		const cells = orientations[orientIndex];
		if (!this.isValidPlacement(turn, cells, [i, j])) this.throw();

		for (const [dx, dy] of cells) {
			this.state.board[i + dx][j + dy] = turn;
		}
		this.state.pieces[turn].remove(this.selectedPiece);
		this.state.placed[turn] = true;
		this.log.push({
			action: 'play',
			time: new Date(),
			turn,
			ctx: { piece: this.selectedPiece, anchor: [i, j] },
		});

		this.clearSelection();

		if (this.state.pieces[turn].length === 0) {
			const winner = this.players[turn];
			this.winCtx = { type: 'win', winner: { ...winner, remaining: 0 } };
			return this.end();
		}

		const next = this.endTurn();
		if (!next) this.end();
	}

	getCells(orient: [number, number][], anchor: [number, number]): [number, number][] {
		const [ai, aj] = anchor;
		return orient.map(([dx, dy]) => [ai + dx, aj + dy] as [number, number]);
	}

	isValidPlacement(turn: Turn, orient: [number, number][], anchor: [number, number], board = this.state.board): boolean {
		const size = this.state.size;
		const cells = this.getCells(orient, anchor);
		const isFirst = !this.state.placed[turn];

		for (const [x, y] of cells) {
			if (x < 0 || y < 0 || x >= size || y >= size) return false;
			if (board[x][y]) return false;
		}

		if (isFirst) {
			return cells.some(([x, y]) => (x === 0 || x === size - 1) && (y === 0 || y === size - 1));
		}

		let touchesCorner = false;
		for (const [x, y] of cells) {
			for (const [dx, dy] of CARDINAL) {
				const nx = x + dx;
				const ny = y + dy;
				if (nx >= 0 && ny >= 0 && nx < size && ny < size && board[nx][ny] === turn) return false;
			}
			for (const [dx, dy] of DIAGONAL) {
				const nx = x + dx;
				const ny = y + dy;
				if (nx >= 0 && ny >= 0 && nx < size && ny < size && board[nx][ny] === turn) touchesCorner = true;
			}
		}
		return touchesCorner;
	}

	getValidAnchors(turn: Turn, pieceId: PieceId, orientIndex: number): [number, number][] {
		const orientations = PIECES[pieceId].orientations;
		const orient = orientations[orientIndex];
		const anchors: [number, number][] = [];
		const board = deepClone(this.state.board);
		for (let i = 0; i < this.state.size; i++) {
			for (let j = 0; j < this.state.size; j++) {
				if (this.isValidPlacement(turn, orient, [i, j], board)) anchors.push([i, j]);
			}
		}
		return anchors;
	}

	hasMoves(turn: Turn): boolean {
		for (const pieceId of this.state.pieces[turn]) {
			const orientations = PIECES[pieceId].orientations;
			const board = deepClone(this.state.board);
			for (const orient of orientations) {
				for (let i = 0; i < this.state.size; i++) {
					for (let j = 0; j < this.state.size; j++) {
						if (this.isValidPlacement(turn, orient, [i, j], board)) return true;
					}
				}
			}
		}
		return false;
	}

	trySkipPlayer(turn: Turn) {
		if (!this.state.placed[turn] && this.state.playerIndex[turn] < 0) return false;
		return !this.hasMoves(turn);
	}

	countRemaining(turn: Turn): number {
		return this.state.pieces[turn].reduce((sum, id) => sum + PIECES[id].size, 0);
	}

	onEnd(type?: EndType): TranslatedText {
		if (type) {
			this.winCtx = { type };
			if (type === 'dq') return this.$T('GAME.ENDED_AUTOMATICALLY', { game: this.meta.name, id: this.id });
			return this.$T('GAME.ENDED', { game: this.meta.name, id: this.id });
		}

		if (this.winCtx?.type === 'win' && 'winner' in this.winCtx) {
			const { winner } = this.winCtx;
			return this.$T('GAME.WON', { winner: `${winner.name} (all pieces placed!)` });
		}

		const scores = Object.fromEntries(Object.keys(this.players).map(turn => [turn, this.countRemaining(turn)]));
		const minScore = Math.min(...Object.values(scores));
		const winnerTurns = Object.entries(scores)
			.filter(([, score]) => score === minScore)
			.map(([turn]) => turn);

		if (winnerTurns.length === 1) {
			const winner = this.players[winnerTurns[0]];
			this.winCtx = { type: 'win', winner: { ...winner, remaining: minScore } };
			return this.$T('GAME.WON', { winner: `${winner.name} (${minScore} blocks left)` });
		}

		this.winCtx = { type: 'win', winnerIds: winnerTurns.map(turn => this.players[turn].id), remaining: scores };
		return this.$T('GAME.DRAW', {
			players: winnerTurns.map(turn => `${this.players[turn].name} (${scores[turn]})`).list(this.$T),
		});
	}

	render(side: Turn | null) {
		const turn = this.turn!;
		const isActive = side === turn;
		let orientations: [number, number][][] | null = null;
		let validAnchors: [number, number][] = [];

		if (isActive && this.selectedPiece) {
			orientations = PIECES[this.selectedPiece].orientations;
			if (this.selectedOrient !== null) {
				validAnchors = this.getValidAnchors(turn, this.selectedPiece, this.selectedOrient);
			}
		}

		const ctx: RenderCtx = {
			id: this.id,
			$T: this.$T,
			board: this.state.board,
			size: this.state.size,
			turn,
			side,
			isActive,
			playerIndex: this.state.playerIndex,
			pieces: this.state.pieces,
			players: Object.fromEntries(Object.entries(this.players).map(([t, p]) => [t, { id: p.id, name: p.name }])),
			selectedPiece: isActive ? this.selectedPiece : null,
			selectedOrient: isActive ? this.selectedOrient : null,
			orientations,
			validAnchors,
			colors: ['#1e88e5', '#fdd835', '#e53935', '#43a047'],
		};

		if (this.winCtx) {
			ctx.header = this.$T('GAME.GAME_ENDED');
		} else if (side === turn) {
			ctx.header = this.$T('GAME.YOUR_TURN');
		} else if (side) {
			ctx.header = this.$T('GAME.WAITING_FOR_PLAYER', { player: this.players[this.turn!]?.name });
			ctx.dimHeader = true;
		} else if (this.turn) {
			const current = this.players[this.turn];
			ctx.header = this.$T('GAME.WAITING_FOR_PLAYER', { player: current.name });
		}

		return render.bind(this.renderCtx)(ctx);
	}
}
