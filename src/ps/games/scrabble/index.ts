import { EmbedBuilder } from 'discord.js';

import { WINNER_ICON } from '@/discord/constants/emotes';
import { Game, createGrid } from '@/ps/games/game';
import { BaseBoard, DIRECTION, LETTER_POINTS, PLAY_ACTION_PATTERN, SELECT_ACTION_PATTERN } from '@/ps/games/scrabble/constants';
import { render } from '@/ps/games/scrabble/render';

import type { TranslatedText } from '@/i18n/types';
import type { EndType } from '@/ps/games/common';
import type { BaseContext } from '@/ps/games/game';
import type { Log } from '@/ps/games/scrabble/logs';
import type { Board, BoardTile, RenderCtx, State, WinCtx } from '@/ps/games/scrabble/types';
import type { User } from 'ps-client';

export { meta } from '@/ps/games/scrabble/meta';

function isLetter(char: string): boolean {
	return /A-Z/.test(char);
}

export class Scrabble extends Game<State> {
	points: Record<string, number> = LETTER_POINTS;
	log: Log[] = [];
	passCount: number | null = null;
	selected: [number, number] | null = null;
	winCtx?: WinCtx | { type: EndType };

	constructor(ctx: BaseContext) {
		super(ctx);
		super.persist(ctx);

		if (ctx.backup) return;
		this.state.board = createGrid<BoardTile | null>(BaseBoard.length, BaseBoard[0].length, () => null);
	}

	parsePosition(str: string): [number, number] {
		if (str.length !== 2) this.throw();
		const coordinates = [str.charAt(0), str.charAt(1)].map(char => parseInt(char, 36)) as [number, number];
		if (coordinates.some(coord => Number.isNaN(coord) || coord >= this.state.board.length)) this.throw();
		return coordinates;
	}

	parseTiles(str: string): BoardTile[] {
		let cursor = 0;
		const tiles: BoardTile[] = [];
		const nextChar = (): string => {
			const char = str.at(cursor)!;
			cursor++;
			return char;
		};
		while (cursor < str.length) {
			const char = nextChar();
			if (isLetter(char)) tiles.push({ letter: char, points: this.points[char] });
			if (char === ' ') continue;
			if ('\'"‘’`'.includes(char)) {
				const lastLetter = tiles.at(-1);
				if (!lastLetter) this.throw();
				lastLetter.blank = true;
				lastLetter.points = 0;
				continue;
			}
			if (char === '[') {
				const letter = nextChar();
				if (!isLetter(letter)) this.throw();
				if (nextChar() !== ']') this.throw();
				tiles.push({ letter, points: 0, blank: true });
				continue;
			}
			if (char === '(') {
				const letter = nextChar();
				if (!isLetter(letter)) this.throw();
				if (nextChar() !== ')') this.throw();
				tiles.push({ letter, points: 0, blank: true });
				continue;
			}
			this.throw();
		}
		return tiles;
	}

	action(user: User, ctx: string): void {
		if (!this.started) this.throw('GAME.NOT_STARTED');
		if (user.id !== this.players[this.turn!].id) this.throw('GAME.IMPOSTOR_ALERT');
		const [action, value] = ctx.lazySplit(' ', 1) as [string | undefined, string | undefined];
		if (!action) this.throw();
		switch (action.charAt(0)) {
			// Select: sXY
			case 's': {
				const match = action.match(SELECT_ACTION_PATTERN);
				if (!match) this.throw();
				const pos = this.parsePosition(match.groups!.pos);
				this.select(pos);
				break;
			}
			// Play: pXYd WORD
			case 'p': {
				if (!value) this.throw();
				const match = action.match(PLAY_ACTION_PATTERN);
				if (!match) this.throw();
				const pos = this.parsePosition(match.groups!.pos);
				this.play(value.toUpperCase(), pos, match.groups!.dir === 'r' ? DIRECTION.RIGHT : DIRECTION.DOWN);
				break;
			}
			// Exchange: x ABC
			case 'x': {
				if (!value) this.throw();
				this.exchange(value);
				break;
			}
			// Pass: -
			case '-': {
				this.pass();
				break;
			}
			default:
				this.throw();
		}
	}

	select(pos: [number, number]): void {
		const turn = this.turn!;
		const player = this.players[turn];
		if (!player) this.throw();
		this.selected = pos;
		this.update(turn);
	}

	play(word: string, [i, j]: [number, number], dir: DIRECTION): void {
		if (!this.selected) this.throw('GAME.SCRABBLE.NO_SELECTED');
		const board = this.state.board;
		const turn = this.turn!;
		const player = this.players[turn];
		if (!player) throw new Error(`Couldn't find player ${turn} in ${JSON.stringify(this.players)}`);

		const rack = this.state.racks[turn];
		const rackCount = rack.count();
		const tiles: BoardTile[] = this.parseTiles(word);
		const tilesCount = tiles.count(true);

		for (const [tile, count] of tilesCount.entries()) {
			const letter = tile.blank ? '_' : tile.letter;
			if (!rackCount[letter]) this.throw('GAME.SCRABBLE.MISSING_LETTER');
			if (rackCount[letter] < count) this.throw('GAME.SCRABBLE.INSUFFICIENT_LETTERS');
		}

		// TODO
		const points = 0;

		const newTiles = this.state.bag.splice(0, tiles.length);
		rack.push(...newTiles);

		this.selected = null;
		this.log.push({ action: 'play', time: new Date(), turn, ctx: { points, tiles, x: i, y: j, dir, rack, newTiles } });

		if (this.state.bag.length === 0) this.end();

		const next = this.nextPlayer();
		if (!next) this.end();
	}

	exchange(letterList: string): void {
		const turn = this.turn!;
		const player = this.players[turn];
		if (!player) this.throw();
		if (!letterList || letterList.length === 0) this.throw();

		const letters = letterList
			.toUpperCase()
			.replace(/[^A-Z_]/g, '')
			.split('');
		if (!letters.length) this.throw();
		const letterCount = letters.count();

		if (this.state.bag.length < letters.length) this.throw('GAME.SCRABBLE.BAG_SIZE', { amount: this.state.bag.length });

		const rack = this.state.racks[turn];
		const rackCount = rack.count();

		for (const [letter, required] of Object.entries(letterCount)) {
			if (!rackCount[letter]) this.throw('GAME.SCRABBLE.MISSING_LETTER', { letter });
			if (rackCount[letter] < required)
				this.throw('GAME.SCRABBLE.INSUFFICIENT_LETTERS', { letter, actual: rackCount[letter], required });
		}

		letters.forEach(letter => rack.remove(letter));

		const newTiles = this.state.bag.splice(0, letters.length, ...letters);
		this.state.bag.shuffle(this.prng);
		rack.push(...newTiles);
	}

	pass(): void {
		this.passCount ??= 0;
		this.passCount++;
		if (this.passCount > Object.keys(this.players).length) {
			this.end('regular');
		}
		this.nextPlayer();
	}

	onEnd(type?: EndType): TranslatedText {
		if (type) {
			this.winCtx = { type };
			if (type === 'dq') return this.$T('GAME.ENDED_AUTOMATICALLY', { game: this.meta.name, id: this.id });
			if (type === 'regular' && this.state.bag.length > 0) return this.$T('GAME.SCRABBLE.TOO_MUCH_PASSING');
			return this.$T('GAME.ENDED', { game: this.meta.name, id: this.id });
		}
		// TODO
		const scores = this.count();
		if (scores.W === scores.B) {
			this.winCtx = { type: 'draw' };
			return this.$T('GAME.DRAW', { players: [this.players.W.name, this.players.B.name].list(this.$T) });
		}
		const winningSide = scores.W > scores.B ? 'W' : 'B';
		const winner = this.players[winningSide];
		const loser = this.players[this.getNext(winningSide)];
		this.winCtx = {
			type: 'win',
			winner: { ...winner, score: scores[winningSide] },
			loser: { ...loser, score: scores[this.getNext(winningSide)] },
		};
		return this.$T('GAME.WON_AGAINST', {
			winner: `${winner.name} (${winningSide})`,
			game: this.meta.name,
			loser: `${loser.name} (${this.getNext(winningSide)})`,
			ctx: ` [${scores[winningSide]}-${scores[this.getNext(winningSide)]}]`,
		});
	}

	renderEmbed(): EmbedBuilder | null {
		const winner = this.winCtx && this.winCtx.type === 'win' ? this.winCtx.winner.id : null;
		if (!winner) return null;
		const winnerPlayer = this.players[winner];
		if (!winnerPlayer) this.throw();
		const winnerBest = this.state.best[winner];
		if (!winnerBest) return null;
		const title = `${winnerPlayer.name}: ${winnerBest.asText} [${winnerBest.points}]`;
		return new EmbedBuilder().setColor('#CCC5A8').setAuthor({ name: 'Scrabble - Room Match' }).setTitle(title);
		// .setURL(this.getURL()) // TODO
	}

	render(side: Turn) {
		const ctx: RenderCtx = {
			board: this.state.board,
			validMoves: side === this.turn ? this.validMoves() : [],
			score: this.count(),
			id: this.id,
		};
		if (this.winCtx) {
			ctx.header = 'Game ended.';
		} else if (side === this.turn) {
			ctx.header = 'Your turn!';
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
