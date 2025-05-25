import { Chess as ChessLib } from 'chess.js';

import { render } from '@/ps/games/chess/render';
import { Game } from '@/ps/games/game';
import { pick } from '@/utils/pick';

import type { TranslatedText } from '@/i18n/types';
import type { Log } from '@/ps/games/chess/logs';
import type { RenderCtx, State, ThemeColours, Turn, WinCtx } from '@/ps/games/chess/types';
import type { ActionResponse, EndType } from '@/ps/games/common';
import type { BaseContext } from '@/ps/games/game';
import type { Move, Square } from 'chess.js';
import type { User } from 'ps-client';

export { meta } from '@/ps/games/chess/meta';

function isValidSquare(input: string): input is Square {
	return /^[a-h][1-9]$/.test(input);
}

export class Chess extends Game<State> {
	selected: Square | null = null;
	showMoves: Move[] = [];
	drawOffered: null | string = null;

	lib: ChessLib;

	log: Log[] = [];
	winCtx?: WinCtx | { type: EndType };
	cache: Record<string, Record<Turn, number>> = {};

	theme: ThemeColours = {
		W: '#fff',
		B: '#9c5624',
		sel: '#87cefa',
		hl: '#adff2fa5',
		last: '#ff330019',
	};

	constructor(ctx: BaseContext) {
		super(ctx);
		super.persist(ctx);

		this.lib = new ChessLib();
		if (ctx.backup) {
			this.lib.loadPgn(this.state.pgn);
		}
	}

	action(user: User, ctx: string): void {
		if (!this.started) this.throw('GAME.NOT_STARTED');
		if (user.id !== this.players[this.turn!].id) this.throw('GAME.IMPOSTOR_ALERT');
		const [actionType, action] = ctx.lazySplit(' ', 1);
		// TODO: Support offering draws
		switch (actionType) {
			case 'select': {
				this.getMoves(action);
				break;
			}
			case 'move': {
				let move: string | { from: string; to: string; promotion?: string } = action;
				try {
					if (action.includes(',')) {
						const [from, to, promotion] = action.split(',');
						move = { from, to, promotion };
					}
				} catch {
					this.throw();
				}
				this.play(move);
				break;
			}
			default:
				this.throw();
		}
	}

	getMoves(spot: string) {
		if (!isValidSquare(spot)) this.throw();
		if (this.selected === spot) {
			this.selected = null;
			this.showMoves = [];
		} else {
			this.selected = spot;
			this.showMoves = this.lib.moves({ square: spot, verbose: true });
		}
		this.update(this.players[this.turn!].id);
	}

	play(move: string | { from: string; to: string; promotion?: string }): void {
		try {
			const res = this.lib.move(move);
			this.log.push({
				action: 'play',
				time: new Date(),
				ctx: pick(res, 'from', 'to', 'promotion', 'san') as Log['ctx'],
				turn: this.turn!,
			});
		} catch {
			this.throw();
		}

		if (this.lib.isGameOver()) return this.end(); // TODO

		this.cleanup();
		this.state.pgn = this.lib.pgn();

		this.nextPlayer();
	}

	// Cleans up stuff like selections and draw offers
	cleanup() {
		this.selected = null;
		this.showMoves = [];
		this.drawOffered = null;
	}

	onReplacePlayer(): ActionResponse<null> {
		this.cleanup();
		return { success: true, data: null };
	}

	onEnd(type?: EndType): TranslatedText {
		if (type) {
			this.winCtx = { type };
			if (type === 'dq') return this.$T('GAME.ENDED_AUTOMATICALLY', { game: this.meta.name, id: this.id });
			return this.$T('GAME.ENDED', { game: this.meta.name, id: this.id });
		}
		// TODO: Upload to Lichess
		if (this.lib.isDraw()) {
			this.winCtx = { type: 'draw' };
			return this.$T('GAME.DRAW', { players: [this.players.w.name, this.players.b.name].list(this.$T) });
		}
		if (this.lib.isCheckmate()) {
			const winner = this.players[this.turn!];
			const loser = this.players[this.getNext(this.turn)];
			this.winCtx = { type: 'win', winner, loser };

			return this.$T('GAME.WON_AGAINST', { winner: winner.name, game: this.meta.name, loser: loser.name, ctx: '' });
		}
		this.throw();
	}

	// renderEmbed(): EmbedBuilder {
	// 	// TODO
	// }

	render(side: Turn | null) {
		const ctx: RenderCtx = {
			board: this.lib.board(),
			showMoves: side === this.turn ? this.showMoves : [],
			selected: side === this.turn ? this.selected : null,
			isActive: side === this.turn,
			side,
			id: this.id,
			turn: this.turn!,
			theme: this.theme,
			small: false,
		};
		if (this.winCtx) {
			ctx.header = 'Game ended.';
			if (side === null) ctx.small = true; // chatroom
		} else if (side === this.turn) {
			ctx.header = 'Your turn!';
			if (this.selected) {
				const selectedPiece = this.lib.get(this.selected);
				const seventhRanks = { w: 7, b: 2 };
				if (selectedPiece?.type === 'p' && seventhRanks[selectedPiece.color] === +this.selected.charAt(1)) ctx.promotion = true;
			}
		} else if (side) {
			ctx.header = 'Waiting for opponent...';
			ctx.dimHeader = true;
		} else if (this.turn) {
			const current = this.players[this.turn];
			ctx.header = `Waiting for ${current.name}${this.sides ? ` (${this.turn})` : ''}...`;
		}
		return render.bind(this.renderCtx)(ctx);
	}
}
