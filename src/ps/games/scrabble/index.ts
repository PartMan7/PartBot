import { EmbedBuilder } from 'discord.js';

import { Game, createGrid } from '@/ps/games/game';
import {
	BaseBoard,
	DIRECTION,
	LETTER_COUNTS,
	LETTER_POINTS,
	PLAY_ACTION_PATTERN,
	RACK_SIZE,
	SELECT_ACTION_PATTERN,
} from '@/ps/games/scrabble/constants';
import { render } from '@/ps/games/scrabble/render';
import { type Point, coincident, flipPoint, multiStepPoint, rangePoints, stepPoint } from '@/utils/grid';

import type { TranslatedText } from '@/i18n/types';
import type { ActionResponse, EndType, Player } from '@/ps/games/common';
import type { BaseContext } from '@/ps/games/game';
import type { Log } from '@/ps/games/scrabble/logs';
import type { BoardTile, Bonus, Points, RenderCtx, State, WinCtx, Word } from '@/ps/games/scrabble/types';
import type { User } from 'ps-client';

export { meta } from '@/ps/games/scrabble/meta';

function isLetter(char: string): boolean {
	return /A-Z/.test(char);
}

export class Scrabble extends Game<State> {
	points: Record<string, number> = LETTER_POINTS;
	log: Log[] = [];
	passCount: number | null = null;
	selected: Point | null = null;
	winCtx?: WinCtx | { type: EndType };

	constructor(ctx: BaseContext) {
		super(ctx);
		super.persist(ctx);

		if (ctx.backup) return;
		this.state.baseBoard = BaseBoard;
		this.state.board = createGrid<BoardTile | null>(BaseBoard.length, BaseBoard[0].length, () => null);
		this.state.bag = Object.entries(LETTER_COUNTS)
			.flatMap(([letter, count]) => letter.repeat(count).split(''))
			.shuffle(this.prng);
		this.state.score = {};
		this.state.best = {};
		this.state.racks = {};
		Object.keys(this.players).forEach(player => {
			this.state.score[player] = 0;
			this.state.racks[player] = this.state.bag.splice(0, RACK_SIZE);
		});
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

	select(pos: Point): void {
		const turn = this.turn!;
		const player = this.players[turn];
		if (!player) this.throw();
		this.selected = pos;
		this.update(turn);
	}

	play(word: string, pos: Point, dir: DIRECTION): void {
		if (!this.selected) this.throw('GAME.SCRABBLE.NO_SELECTED');
		const board = this.state.board;
		const turn = this.turn!;
		const player = this.players[turn];
		if (!player) throw new Error(`Couldn't find player ${turn} in ${JSON.stringify(this.players)}`);

		const inlineStep: Point = dir === DIRECTION.RIGHT ? [0, 1] : [1, 0];

		const rack = this.state.racks[turn];
		const rackCount = rack.count();
		const tiles: BoardTile[] = this.parseTiles(word, pos, inlineStep);
		const playedTiles = tiles.filter((playedTile, index) => {
			const existingTile = this.readFromBoard(multiStepPoint(pos, inlineStep, index));
			if (existingTile && existingTile.letter !== playedTile.letter) this.throw();
			return !existingTile;
		});
		const playedTilesCount = playedTiles.count(true);

		for (const [tile, count] of playedTilesCount.entries()) {
			const letter = tile.blank ? '_' : tile.letter;
			if (!rackCount[letter]) this.throw('GAME.SCRABBLE.MISSING_LETTER');
			if (rackCount[letter] < count) this.throw('GAME.SCRABBLE.INSUFFICIENT_LETTERS');
		}

		let inlineStart = pos;
		let prefixLength = 0;
		const backstep = flipPoint(inlineStep);
		while (true) {
			const oneBefore = stepPoint(inlineStart, backstep);
			if (!this.readFromBoard(oneBefore)) break;
			prefixLength++;
			inlineStart = oneBefore;
		}
		let inlineEnd = multiStepPoint(pos, inlineStep, tiles.length);
		while (true) {
			const nextTile = stepPoint(inlineEnd, inlineStep);
			if (!this.readFromBoard(nextTile)) break;
			inlineEnd = nextTile;
		}

		const isFirstMove = board.flat(2).some(tile => tile);

		let connected = isFirstMove;

		const inlineBonuses: Bonus[] = [];
		const inlineData = rangePoints(inlineStart, inlineEnd).map((point, index) => {
			const isPlayedTile = index >= prefixLength && index - prefixLength < tiles.length;
			const boardTile = this.readFromBoard(point);
			if (boardTile) {
				if (!isPlayedTile) connected = true;
				return { letter: boardTile.letter, points: boardTile.points };
			}
			if (isPlayedTile) {
				const bonus = this.state.baseBoard.access(point);
				if (bonus) inlineBonuses.push(bonus);
				const playedTile = tiles[index - prefixLength];
				return { letter: playedTile.letter, points: playedTile.points };
			}
			this.throw();
		});
		const inlineWord = inlineData.map(tile => tile.letter).join('');
		const inlineScore = inlineData.map(tile => tile.points).sum();

		if (isFirstMove && !inlineBonuses.includes('2*')) this.throw('GAME.SCRABBLE.FIRST_MOVE_CENTER');
		if (isFirstMove && playedTiles.length < 2) this.throw('GAME.SCRABBLE.FIRST_MOVE_MULTIPLE_TILES');

		const crossStep: Point = dir === DIRECTION.RIGHT ? [1, 0] : [0, 1];
		const crossBackstep = flipPoint(crossStep);
		const crossWords = playedTiles.map(playedTile => {
			let crossStart = playedTile.pos;
			while (true) {
				const backstep = stepPoint(crossStart, crossBackstep);
				if (!this.readFromBoard(backstep)) break;
				crossStart = backstep;
			}
			let crossEnd = playedTile.pos;
			while (true) {
				const nextTile = stepPoint(crossEnd, crossStep);
				if (!this.readFromBoard(nextTile)) break;
				crossEnd = nextTile;
			}

			const crossData = rangePoints(crossStart, crossEnd).map(point => {
				const isPlayedTile = coincident(point, playedTile.pos);
				if (!isPlayedTile) connected = true;
				const tile = this.readFromBoard(point);
				if (tile) return { letter: tile.letter, points: tile.points };
				if (isPlayedTile) return { letter: playedTile.letter, points: playedTile.points };
				this.throw();
			});

			return {
				word: crossData.map(tile => tile.letter).join(''),
				baseScore: crossData.map(tile => tile.points).sum(),
				bonus: this.state.baseBoard.access(playedTile.pos),
			};
		});

		if (!connected) this.throw('GAME.SCRABBLE.MUST_BE_CONNECTED');

		const words: Word[] = [
			{ word: inlineWord, baseScore: inlineScore, bonuses: inlineBonuses },
			...crossWords.map(({ word, baseScore, bonus }) => ({ word, baseScore, bonuses: bonus ? [bonus] : [] })),
		].filter(entry => entry.word.length > 1);

		if (!words.length) this.throw();

		const points = this.score(words, playedTiles.length === RACK_SIZE);

		playedTiles.forEach(playedTile => {
			board[playedTile.pos[0]][playedTile.pos[1]] = playedTile;
		});

		const newTiles = this.state.bag.splice(0, playedTiles.length);
		rack.push(...newTiles);

		this.selected = null;
		this.log.push({ action: 'play', time: new Date(), turn, ctx: { points, tiles, point: pos, dir, rack, newTiles } });

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

		this.log.push({ action: 'exchange', time: new Date(), turn, ctx: { tiles: letters, newTiles, rack } });
	}

	pass(): void {
		const turn = this.turn!;
		this.passCount ??= 0;
		this.passCount++;
		this.log.push({ action: 'pass', time: new Date(), turn, ctx: { rack: this.state.racks[turn] } });
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

		const winners = Object.entries(this.state.score).map(([id, score]) => ({
			...this.players[id],
			score,
		}));
		this.winCtx = {
			type: 'win',
			winnerIds: winners.map(winner => winner.id),
			score: this.state.score,
		};
		return this.$T('GAME.WON', { winner: `${winners.list(this.$T)}` });
	}

	onReplacePlayer(oldPlayer: string, withPlayer: User): ActionResponse<Partial<Player>> {
		[this.state.score, this.state.racks, this.state.best].forEach(state => {
			state[withPlayer.id] = state[oldPlayer];
			delete state[oldPlayer];
		});
		return { success: true, data: {} };
	}

	render(side: string | null) {
		const ctx: RenderCtx = {
			id: this.id,
			baseBoard: this.state.baseBoard,
			board: this.state.board,
			bag: this.state.bag.length,
			score: this.state.score,
		};
		if (this.winCtx) {
			ctx.header = 'Game ended.';
		} else if (side && side === this.turn) {
			ctx.header = 'Your turn!';
			ctx.rack = this.state.racks[side];
		} else if (side) {
			ctx.header = `Waiting for ${this.players[this.turn!]?.name}...`;
			ctx.dimHeader = true;
		} else if (this.turn) {
			const current = this.players[this.turn];
			ctx.header = `Waiting for ${current.name}${this.sides ? ` (${this.turn})` : ''}...`;
		}
		return render.bind(this.renderCtx)(ctx);
	}

	renderEmbed(): EmbedBuilder | null {
		const winners = this.winCtx && this.winCtx.type === 'win' ? this.winCtx.winnerIds : null;
		if (!winners) return null;
		const winnerPlayers = winners.map(winner => ({ ...this.players[winner], best: this.state.best[winner] }));
		if (!winnerPlayers.length || winnerPlayers.some(player => !player)) this.throw();
		const winnerBests = winners.map(winner => this.state.best[winner]);
		if (!winnerBests.length) return null;
		const bestPlayer = winnerPlayers.sortBy(player => player.best?.points ?? 0, 'desc')[0];
		if (!bestPlayer?.best) return null;
		const title = `${bestPlayer.name}: ${bestPlayer.best.asText} [${bestPlayer.best.points}]`;
		return new EmbedBuilder().setColor('#CCC5A8').setAuthor({ name: 'Scrabble - Room Match' }).setTitle(title);
		// .setURL(this.getURL()) // TODO
	}

	readFromBoard([x, y]: Point): BoardTile | null {
		if (x < 0 || y < 0 || x >= this.state.board.length || y >= this.state.board[0].length) this.throw();
		return this.state.board[x][y];
	}

	parsePosition(str: string): Point {
		if (str.length !== 2) this.throw();
		const coordinates = [str.charAt(0), str.charAt(1)].map(char => parseInt(char, 36)) as Point;
		if (coordinates.some(coord => Number.isNaN(coord) || coord >= this.state.board.length)) this.throw();
		return coordinates;
	}

	parseTiles(str: string, pos: Point, inlineStep: Point): BoardTile[] {
		let cursor = 0;
		const tiles: BoardTile[] = [];
		const nextChar = (): string => {
			const char = str.at(cursor)!;
			cursor++;
			return char;
		};
		while (cursor < str.length) {
			const char = nextChar();
			const nextPos = multiStepPoint(pos, inlineStep, tiles.length);
			if (isLetter(char)) tiles.push({ letter: char, points: this.points[char], pos: nextPos });
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
				tiles.push({ letter, points: 0, blank: true, pos: nextPos });
				continue;
			}
			if (char === '(') {
				const letter = nextChar();
				if (!isLetter(letter)) this.throw();
				if (nextChar() !== ')') this.throw();
				tiles.push({ letter, points: 0, blank: true, pos: nextPos });
				continue;
			}
			this.throw();
		}
		return tiles;
	}

	checkWord(word: string): [number, number] | null {
		// TODO handle mods here
		// TODO Add dictionary
		if (!word) return null;
		return [1, 0];
	}

	score(words: Word[], bingo: boolean): Points {
		// TODO handle mods here
		const bingoPoints = bingo ? 50 : 0;
		const wordsPoints = Object.fromEntries(
			words.map(word => {
				const scoring = this.checkWord(word.word);
				if (!scoring) this.throw('GAME.SCRABBLE.INVALID_WORD');
				return [word.word, word.baseScore * scoring[0] + scoring[1]];
			})
		);
		return { total: Object.values(wordsPoints).sum() + bingoPoints, bingo, words: wordsPoints };
	}
}
