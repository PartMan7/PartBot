import { EmbedBuilder } from 'discord.js';

import { Game, createGrid } from '@/ps/games/game';
import { checkWord } from '@/ps/games/scrabble/checker';
import {
	BaseBoard,
	DIRECTION,
	LETTER_COUNTS,
	LETTER_POINTS,
	PLAY_ACTION_PATTERN,
	RACK_SIZE,
	SELECT_ACTION_PATTERN,
} from '@/ps/games/scrabble/constants';
import { ScrabbleModData } from '@/ps/games/scrabble/mods';
import { render, renderMove } from '@/ps/games/scrabble/render';
import { type Point, coincident, flipPoint, multiStepPoint, rangePoints, stepPoint } from '@/utils/grid';

import type { TranslatedText } from '@/i18n/types';
import type { ActionResponse, EndType } from '@/ps/games/common';
import type { BaseContext } from '@/ps/games/game';
import type { ScrabbleMods } from '@/ps/games/scrabble/constants';
import type { Log } from '@/ps/games/scrabble/logs';
import type { BoardTile, Bonus, BonusReducer, Points, RenderCtx, State, WinCtx, Word, WordScore } from '@/ps/games/scrabble/types';
import type { User } from 'ps-client';

export { meta } from '@/ps/games/scrabble/meta';

function isLetter(char: string): boolean {
	return /[A-Z]/.test(char);
}

export class Scrabble extends Game<State> {
	points: Record<string, number> = LETTER_POINTS;
	log: Log[] = [];
	passCount: number | null = null;
	selected: Point | null = null;
	winCtx?: WinCtx | { type: EndType };
	mod: ScrabbleMods | null = null;

	constructor(ctx: BaseContext) {
		super(ctx);
		super.persist(ctx);

		if (ctx.backup) return;
	}

	moddable() {
		if (!this.started) return true;
		const isEmptyBoard = !this.state.board.some(row => row.some(Boolean));
		if (isEmptyBoard) return true;
		return false;
	}

	applyMod(mod: ScrabbleMods): ActionResponse<TranslatedText> {
		this.mod = mod;
		return { success: true, data: this.$T('GAME.APPLIED_MOD', { mod: ScrabbleModData[mod].name, id: this.id }) };
	}

	onStart(): ActionResponse {
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
		return { success: true, data: null };
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
			if (existingTile && existingTile.letter !== playedTile.letter) {
				this.throw('GAME.SCRABBLE.TILE_MISMATCH', { placed: playedTile.letter, actual: existingTile.letter });
			}
			return !existingTile;
		});
		if (!playedTiles.length) this.throw('GAME.SCRABBLE.MUST_PLAY_TILES');
		const playedTilesCount = playedTiles.count(true);

		for (const [tile, count] of playedTilesCount.entries()) {
			const letter = tile.blank ? '_' : tile.letter;
			if (!rackCount[letter]) this.throw('GAME.SCRABBLE.MISSING_LETTER', { letter });
			if (rackCount[letter] < count) {
				this.throw('GAME.SCRABBLE.INSUFFICIENT_LETTERS', { letter, actual: rackCount[letter], required: count });
			}
		}

		let inlineStart = pos;
		const backstep = flipPoint(inlineStep);
		while (true) {
			const oneBefore = stepPoint(inlineStart, backstep);
			if (!this.readFromBoard(oneBefore, true)) break;
			inlineStart = oneBefore;
		}
		let inlineEnd = multiStepPoint(pos, inlineStep, tiles.length - 1);
		while (true) {
			const nextTile = stepPoint(inlineEnd, inlineStep);
			if (!this.readFromBoard(nextTile, true)) break;
			inlineEnd = nextTile;
		}

		const isFirstMove = !board.flat(2).some(tile => tile);

		let connected = isFirstMove;
		let coversCenter = false;

		const inlineBonuses: BonusReducer[] = [];
		const inlineTiles = rangePoints(inlineStart, inlineEnd).map(point => {
			const playedTile = playedTiles.find(tile => coincident(tile.pos, point));
			const boardTile = this.readFromBoard(point);
			if (boardTile) {
				connected = true;
				return boardTile;
			}
			if (playedTile) {
				const bonus = this.state.baseBoard.access(point);
				if (bonus) inlineBonuses.push(this.parseBonus(bonus, playedTile));
				if (bonus === '2*') coversCenter = true;
				return playedTile;
			}
			this.throw();
		});
		const inlineWordValue = inlineTiles.map(tile => tile.letter).join('');
		const inlineScore = inlineTiles.map(tile => tile.points).sum();

		if (isFirstMove && !coversCenter) this.throw('GAME.SCRABBLE.FIRST_MOVE_CENTER');
		if (isFirstMove && playedTiles.length < 2) this.throw('GAME.SCRABBLE.FIRST_MOVE_MULTIPLE_TILES');

		const inlineWord: Word = { word: inlineWordValue, baseScore: inlineScore, bonuses: inlineBonuses };

		const crossStep: Point = dir === DIRECTION.RIGHT ? [1, 0] : [0, 1];
		const crossBackstep = flipPoint(crossStep);
		const crossWords = playedTiles.map<Word>(playedTile => {
			let crossStart = playedTile.pos;
			while (true) {
				const backstep = stepPoint(crossStart, crossBackstep);
				if (!this.readFromBoard(backstep, true)) break;
				crossStart = backstep;
			}
			let crossEnd = playedTile.pos;
			while (true) {
				const nextTile = stepPoint(crossEnd, crossStep);
				if (!this.readFromBoard(nextTile, true)) break;
				crossEnd = nextTile;
			}

			const crossTiles = rangePoints(crossStart, crossEnd).map(point => {
				const isPlayedTile = coincident(point, playedTile.pos);
				if (!isPlayedTile) connected = true;
				const tile = this.readFromBoard(point);
				if (tile) return tile;
				if (isPlayedTile) return playedTile;
				this.throw();
			});

			const bonus = this.parseBonus(this.state.baseBoard.access(playedTile.pos), playedTile);

			return {
				word: crossTiles.map(tile => tile.letter).join(''),
				baseScore: crossTiles.map(tile => tile.points).sum(),
				bonuses: bonus ? [bonus] : [],
			};
		});

		if (!connected) this.throw('GAME.SCRABBLE.MUST_BE_CONNECTED');

		const words: Word[] = [inlineWord, ...crossWords].filter(entry => entry.word.length > 1);

		if (!words.length) this.throw();

		const points = this.score(words, playedTiles.length === RACK_SIZE);

		playedTiles.forEach(playedTile => {
			board[playedTile.pos[0]][playedTile.pos[1]] = playedTile;
			rack.remove(playedTile.blank ? '_' : playedTile.letter);
		});

		const newTiles = this.state.bag.splice(0, playedTiles.length);
		rack.push(...newTiles);
		if (newTiles.includes('_')) this.room.privateSend(turn, this.$T('GAME.SCRABBLE.HOW_TO_BLANK'));

		this.state.score[turn] += points.total;

		const logEntry: Log = {
			action: 'play',
			time: new Date(),
			turn,
			ctx: { points, tiles, point: pos, dir, rack, newTiles, words: points.words },
		};
		this.log.push(logEntry);
		this.room.sendHTML(...renderMove(logEntry, this));
		this.selected = null;

		if (rack.length === 0) return this.end();
		const next = this.nextPlayer();
		if (!next) return this.end();
	}

	exchange(letterList: string): void {
		const turn = this.turn!;
		const player = this.players[turn];
		if (!player) this.throw();
		if (this.state.bag.length < RACK_SIZE) this.throw('GAME.SCRABBLE.BAG_SIZE', { amount: this.state.bag.length });
		if (!letterList || letterList.length === 0) this.throw();

		const letters = letterList
			.toUpperCase()
			.replace(/[^A-Z_]/g, '')
			.split('');
		if (!letters.length) this.throw();
		const letterCount = letters.count();

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
		if (newTiles.includes('_')) this.room.privateSend(turn, this.$T('GAME.SCRABBLE.HOW_TO_BLANK'));

		const logEntry: Log = { action: 'exchange', time: new Date(), turn, ctx: { tiles: letters, newTiles, rack } };
		this.log.push(logEntry);
		this.room.sendHTML(...renderMove(logEntry, this));

		this.nextPlayer();
	}

	pass(): void {
		const turn = this.turn!;
		this.passCount ??= 0;
		this.passCount++;
		const logEntry: Log = { action: 'pass', time: new Date(), turn, ctx: { rack: this.state.racks[turn] } };
		this.log.push(logEntry);
		this.room.sendHTML(...renderMove(logEntry, this));
		if (this.passCount > Object.keys(this.players).length) {
			return this.end('regular');
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

		const winners = Object.entries(this.state.score)
			.map(([id, score]) => ({
				...this.players[id],
				score,
			}))
			.sortBy(entry => entry.score, 'desc')
			.filter((entry, _, list) => entry.score === list[0].score);

		Object.keys(this.players).forEach(playerId => {
			this.state.score[playerId] -= this.state.racks[playerId].map(tile => this.points[tile]).sum();
		});
		this.winCtx = {
			type: 'win',
			winnerIds: winners.map(winner => winner.id),
			score: this.state.score,
		};
		return this.$T('GAME.WON', { winner: `${winners.map(winner => winner.name).list(this.$T)}` });
	}

	onReplacePlayer(oldPlayer: string, withPlayer: User): ActionResponse<null> {
		if (this.started) {
			[this.state.score, this.state.racks, this.state.best].forEach(state => {
				state[withPlayer.id] = state[oldPlayer];
				delete state[oldPlayer];
			});
		}
		return { success: true, data: null };
	}

	render(side: string | null) {
		const isActive = !!side && side === this.turn;
		const ctx: RenderCtx = {
			id: this.id,
			baseBoard: this.state.baseBoard,
			board: this.state.board,
			bag: this.state.bag.length,
			getPoints: tile => this.points[tile],
			rack: side ? this.state.racks[side] : undefined,
			players: Object.fromEntries(
				Object.values(this.players).map(({ id, name, out }) => [
					id,
					{ id, name, score: this.state.score[id], rack: this.state.racks[id].length, out },
				])
			),
			isActive,
			side,
			turn: this.turn!,
			selected: side && side === this.turn ? this.selected : null,
		};
		if (this.winCtx) {
			ctx.header = 'Game ended.';
		} else if (isActive) {
			ctx.header = 'Your turn!';
		} else if (side) {
			ctx.header = `Waiting for ${this.players[this.turn!]?.name}...`;
			ctx.dimHeader = true;
		} else if (this.turn) {
			const current = this.players[this.turn];
			ctx.header = `Waiting for ${current.name}${this.sides ? ` (${this.turn})` : ''}...`;
		}
		return render.bind(this.renderCtx)(ctx);
	}

	async renderEmbed(): Promise<EmbedBuilder | null> {
		const winners = this.winCtx && this.winCtx.type === 'win' ? this.winCtx.winnerIds : null;
		if (!winners) return null;
		const winnerPlayers = winners.map(winner => ({ ...this.players[winner], best: this.state.best[winner] }));
		if (!winnerPlayers.length || winnerPlayers.some(player => !player)) this.throw();
		const winnerBests = winners.map(winner => this.state.best[winner]);
		if (!winnerBests.length) return null;
		const bestPlayer = winnerPlayers.sortBy(player => player.best?.points ?? 0, 'desc')[0];
		if (!bestPlayer?.best) return null;
		const title = `${bestPlayer.name}: ${bestPlayer.best.asText} [${bestPlayer.best.points}]`;
		return new EmbedBuilder().setColor('#ccc5a8').setAuthor({ name: 'Scrabble - Room Match' }).setTitle(title);
		// .setURL(this.getURL()) // TODO
	}

	readFromBoard([x, y]: Point, safe?: boolean): BoardTile | null {
		if (x < 0 || y < 0 || x >= this.state.board.length || y >= this.state.board[0].length) {
			if (safe) return null;
			this.throw();
		}
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
			if (isLetter(char)) {
				tiles.push({ letter: char, points: this.points[char], pos: nextPos });
				continue;
			}
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

	parseBonus(bonus: Bonus | null, tile: BoardTile): BonusReducer {
		return score => {
			if (!bonus) return score;
			const modifier = +bonus.charAt(0);
			const additive = bonus.charAt(1) === 'L';
			return additive ? score + (modifier - 1) * tile.points : score * modifier;
		};
	}

	checkWord(word: string): WordScore | null {
		if (!word) return null;
		return checkWord(word, this.mod);
	}

	score(words: Word[], bingo: boolean): Points {
		const bingoPoints = bingo ? 50 : 0;
		const wordData = words.map<[string, number | null]>(word => {
			const scoring = this.checkWord(word.word);
			if (!scoring) return [word.word, null];
			return [word.word, word.bonuses.reduce((score, bonus) => bonus(score), word.baseScore) * scoring[0] + scoring[1]];
		});
		const invalidWords = wordData.filter(entry => entry[1] === null).map(entry => entry[0]);
		if (invalidWords.length > 0) {
			this.throw(invalidWords.length === 1 ? 'GAME.SCRABBLE.INVALID_WORD' : 'GAME.SCRABBLE.INVALID_WORDS', {
				wordList: invalidWords.list(this.$T),
			});
		}
		const wordsPoints = Object.fromEntries(wordData as [string, number][]);
		return { total: Object.values(wordsPoints).sum() + bingoPoints, bingo, words: wordsPoints };
	}
}
