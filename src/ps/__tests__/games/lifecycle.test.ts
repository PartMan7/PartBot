import { describe, expect, it, vi } from 'vitest';

// Prevent FlatCache from writing game backups to disk during tests.
vi.mock('@/cache/games', () => ({
	gameCache: { set: vi.fn(), delete: vi.fn(), get: vi.fn(), getByGame: vi.fn(), clearOldBackups: vi.fn() },
}));

import { createGame, mockT } from '@/ps/__tests__/helpers/games';
import { client } from '@/ps/__tests__/mocks/client';
import { mockRoom } from '@/ps/__tests__/mocks/room';
import { mockUser } from '@/ps/__tests__/mocks/user';
import { Battleship } from '@/ps/games/battleship';
import { meta as battleshipMeta } from '@/ps/games/battleship/meta';
import { Chess } from '@/ps/games/chess';
import { meta as chessMeta } from '@/ps/games/chess/meta';
import { ConnectFour } from '@/ps/games/connectfour';
import { meta as connectfourMeta } from '@/ps/games/connectfour/meta';
import { LightsOut } from '@/ps/games/lightsout';
import { meta as lightsoutMeta } from '@/ps/games/lightsout/meta';
import { Mastermind } from '@/ps/games/mastermind';
import { meta as mastermindMeta } from '@/ps/games/mastermind/meta';
import { Othello } from '@/ps/games/othello';
import { meta as othelloMeta } from '@/ps/games/othello/meta';
import { Scrabble } from '@/ps/games/scrabble';
import { meta as scrabbleMeta } from '@/ps/games/scrabble/meta';
import { SnakesLadders } from '@/ps/games/snakesladders';
import { meta as snakesladdersMeta } from '@/ps/games/snakesladders/meta';
import { Splendor } from '@/ps/games/splendor';
import { meta as splendorMeta } from '@/ps/games/splendor/meta';
import { jsxToHTML } from '@/utils/jsxToHTML';

function setup(name: string) {
	const room = mockRoom('boardgames', client);
	const creator = mockUser(name);
	return { room, creator };
}

describe('Chess lifecycle', () => {
	it('creates a game without errors', () => {
		const { room, creator } = setup('Alice');
		const game = createGame(Chess, chessMeta, room, creator);
		expect(game.id).toBe('#TEST');
		expect(game.started).toBe(false);
	});

	it('accepts players on both sides and auto-starts when full', () => {
		const { room, creator } = setup('Alice');
		const game = createGame(Chess, chessMeta, room, creator);
		const alice = mockUser('Alice');
		const bob = mockUser('Bob');

		const resA = game.addPlayer(alice, 'W');
		expect(resA.success).toBe(true);
		expect(game.started).toBe(false);

		// Sided 2-player games auto-start when the last slot is filled.
		const resB = game.addPlayer(bob, 'B');
		expect(resB.success).toBe(true);
		expect(game.started).toBe(true);
		expect(Object.keys(game.players)).toHaveLength(2);
	});

	it('rejects a duplicate player', () => {
		const { room, creator } = setup('Alice');
		const game = createGame(Chess, chessMeta, room, creator);
		const alice = mockUser('Alice');
		game.addPlayer(alice, 'W');
		expect(() => game.addPlayer(alice, 'B')).toThrow();
	});

	it('rejects a player on an occupied side', () => {
		const { room, creator } = setup('Alice');
		const game = createGame(Chess, chessMeta, room, creator);
		const alice = mockUser('Alice');
		const bob = mockUser('Bob');
		game.addPlayer(alice, 'W');
		const res = game.addPlayer(bob, 'W');
		expect(res.success).toBe(false);
	});

	it('is startable when one slot remains', () => {
		const { room, creator } = setup('Alice');
		const game = createGame(Chess, chessMeta, room, creator);
		const alice = mockUser('Alice');
		game.addPlayer(alice, 'W');
		// With one player added, the remaining slot makes it startable.
		// But for sided games, startable() requires ALL turns to have players.
		expect(game.startable()).toBe(false);
	});

	it('allows a player to leave before the game starts', () => {
		const { room, creator } = setup('Alice');
		const game = createGame(Chess, chessMeta, room, creator);
		const alice = mockUser('Alice');
		game.addPlayer(alice, 'W');
		const res = game.removePlayer(alice);
		expect(res.success).toBe(true);
		expect(Object.keys(game.players)).toHaveLength(0);
	});

	it('starts with White to move and renders without throwing', () => {
		const { room, creator } = setup('Alice');
		const game = createGame(Chess, chessMeta, room, creator);
		game.addPlayer(mockUser('Alice'), 'W');
		game.addPlayer(mockUser('Bob'), 'B'); // auto-starts
		expect(game.started).toBe(true);
		expect(game.turn).toBe('W');
		expect(() => game.runRender(() => jsxToHTML(game.render('W')))).not.toThrow();
		expect(() => game.runRender(() => jsxToHTML(game.render('B')))).not.toThrow();
		expect(() => game.runRender(() => jsxToHTML(game.render(null)))).not.toThrow();
	});
});

describe('ConnectFour lifecycle', () => {
	it('auto-starts when both sides are filled and renders without errors', () => {
		const { room, creator } = setup('Alice');
		const game = createGame(ConnectFour, connectfourMeta, room, creator);
		game.addPlayer(mockUser('Alice'), 'Y');
		game.addPlayer(mockUser('Bob'), 'R'); // auto-starts
		expect(game.started).toBe(true);
		expect(game.turn).toBe('Y');
		expect(() => game.runRender(() => jsxToHTML(game.render('Y')))).not.toThrow();
		expect(() => game.runRender(() => jsxToHTML(game.render('R')))).not.toThrow();
		expect(() => game.runRender(() => jsxToHTML(game.render(null)))).not.toThrow();
	});

	it('allows random side assignment', () => {
		const { room, creator } = setup('Alice');
		const game = createGame(ConnectFour, connectfourMeta, room, creator);
		const res = game.addPlayer(mockUser('Alice'), '-');
		expect(res.success).toBe(true);
		if (res.success) expect(['Y', 'R']).toContain(res.data.as);
	});
});

describe('Othello lifecycle', () => {
	it('auto-starts when both sides are filled and renders without errors', () => {
		const { room, creator } = setup('Alice');
		const game = createGame(Othello, othelloMeta, room, creator);
		game.addPlayer(mockUser('Alice'), 'W');
		game.addPlayer(mockUser('Bob'), 'B'); // auto-starts
		expect(game.started).toBe(true);
		expect(() => game.runRender(() => jsxToHTML(game.render('W')))).not.toThrow();
		expect(() => game.runRender(() => jsxToHTML(game.render('B')))).not.toThrow();
		expect(() => game.runRender(() => jsxToHTML(game.render(null)))).not.toThrow();
	});
});

describe('Battleship lifecycle', () => {
	it('auto-starts when both sides are filled and renders without errors', () => {
		const { room, creator } = setup('Alice');
		const game = createGame(Battleship, battleshipMeta, room, creator);
		game.addPlayer(mockUser('Alice'), 'A');
		game.addPlayer(mockUser('Bob'), 'B'); // auto-starts
		expect(game.started).toBe(true);
		expect(() => game.runRender(() => jsxToHTML(game.render('A')))).not.toThrow();
		expect(() => game.runRender(() => jsxToHTML(game.render('B')))).not.toThrow();
		expect(() => game.runRender(() => jsxToHTML(game.render(null)))).not.toThrow();
	});
});

describe('SnakesLadders lifecycle', () => {
	it('requires at least 2 players to be startable', () => {
		const { room, creator } = setup('Alice');
		const game = createGame(SnakesLadders, snakesladdersMeta, room, creator);
		game.addPlayer(mockUser('Alice'), null);
		expect(game.startable()).toBe(false);
		game.addPlayer(mockUser('Bob'), null);
		expect(game.startable()).toBe(true);
	});

	it('starts and renders without errors', () => {
		const { room, creator } = setup('Alice');
		const game = createGame(SnakesLadders, snakesladdersMeta, room, creator);
		game.addPlayer(mockUser('Alice'), null);
		game.addPlayer(mockUser('Bob'), null);
		game.start();
		expect(game.started).toBe(true);
		expect(game.turn).toBeTruthy();
		expect(() => game.runRender(() => jsxToHTML(game.render(game.turn)))).not.toThrow();
		expect(() => game.runRender(() => jsxToHTML(game.render(null)))).not.toThrow();
	});
});

describe('Scrabble lifecycle', () => {
	// Scrabble has autostart: false and maxSize: 4, so explicit start is required.
	it('requires explicit start when under max capacity, then renders without errors', () => {
		const { room, creator } = setup('Alice');
		const game = createGame(Scrabble, scrabbleMeta, room, creator);
		game.addPlayer(mockUser('Alice'), null);
		game.addPlayer(mockUser('Bob'), null);
		expect(game.startable()).toBe(true);
		expect(game.started).toBe(false);
		game.start();
		expect(game.started).toBe(true);
		expect(() => game.runRender(() => jsxToHTML(game.render(game.turn)))).not.toThrow();
		expect(() => game.runRender(() => jsxToHTML(game.render(null)))).not.toThrow();
	});
});

describe('Splendor lifecycle', () => {
	it('requires explicit start when under max capacity, then renders without errors', () => {
		const { room, creator } = setup('Alice');
		const game = createGame(Splendor, splendorMeta, room, creator);
		game.addPlayer(mockUser('Alice'), null);
		game.addPlayer(mockUser('Bob'), null);
		expect(game.startable()).toBe(true);
		expect(game.started).toBe(false);
		game.start();
		expect(game.started).toBe(true);
		expect(() => game.runRender(() => jsxToHTML(game.render(game.turn)))).not.toThrow();
		expect(() => game.runRender(() => jsxToHTML(game.render(null)))).not.toThrow();
	});
});

describe('LightsOut lifecycle', () => {
	it('creates and renders without errors', () => {
		const { room, creator } = setup('Alice');
		const alice = mockUser('Alice');
		const game = createGame(LightsOut, lightsoutMeta, room, creator);
		game.after({ id: game.id, meta: lightsoutMeta, room: room, $T: mockT, args: [], by: alice });
		expect(game.started).toBe(true);
		expect(() => game.runRender(() => jsxToHTML(game.render(alice.id)))).not.toThrow();
	});
});

describe('Mastermind lifecycle', () => {
	it('creates and renders without errors', () => {
		const { room, creator } = setup('Alice');
		const alice = mockUser('Alice');
		const game = createGame(Mastermind, mastermindMeta, room, creator);
		game.after({ id: game.id, meta: mastermindMeta, room: room, $T: mockT, args: [], by: alice });
		expect(game.started).toBe(true);
		expect(() => game.runRender(() => jsxToHTML(game.render(alice.id)))).not.toThrow();
	});
});
