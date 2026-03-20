import { describe, expect, it, vi } from 'vitest';

vi.mock('@/cache/games', () => ({
	gameCache: { set: vi.fn(), delete: vi.fn(), get: vi.fn(), getByGame: vi.fn(), clearOldBackups: vi.fn() },
}));

import { runGamePlayCommand } from '@/ps/__tests__/helpers/commands';
import { createGame, getButtonActions } from '@/ps/__tests__/helpers/games';
import { client } from '@/ps/__tests__/mocks/client';
import { mockRoom } from '@/ps/__tests__/mocks/room';
import { mockUser } from '@/ps/__tests__/mocks/user';
import { Chess } from '@/ps/games/chess';
import { meta } from '@/ps/games/chess/meta';

import type { MockRoom } from '@/ps/__tests__/mocks/room';
import type { MockUser } from '@/ps/__tests__/mocks/user';
import type { Square } from 'chess.js';

function setupGame() {
	const room = mockRoom('boardgames', client);
	const game = createGame(Chess, meta, room, mockUser('Tester'));
	const userW = mockUser('White');
	const userB = mockUser('Black');
	game.addPlayer(userW, 'W');
	game.addPlayer(userB, 'B'); // auto-starts
	return { game, room, userW, userB };
}

/**
 * Selects a piece and makes a move, verifying the required buttons are present
 * in the rendered HTML at each step.
 */
async function selectAndMove(
	game: InstanceType<typeof Chess>,
	room: MockRoom,
	user: MockUser,
	turn: 'W' | 'B',
	from: Square,
	san: string
): Promise<void> {
	const beforeSelect = getButtonActions(game.render(turn), game);
	expect(beforeSelect, `Expected "select ${from}" to be available for ${turn}`).toContain(`select ${from}`);
	await runGamePlayCommand(game, user, room, `select ${from}`);

	const afterSelect = getButtonActions(game.render(turn), game);
	expect(afterSelect, `Expected "move ${san}" to be available after selecting ${from}`).toContain(`move ${san}`);
	await runGamePlayCommand(game, user, room, `move ${san}`);
}

describe("Chess playthrough — Scholar's Mate", () => {
	/**
	 * Scholar's Mate: White wins on move 4.
	 *   1. e4     e5
	 *   2. Bc4    Nc6
	 *   3. Qh5    Nf6??
	 *   4. Qxf7#
	 */
	it("plays Scholar's Mate using only HTML button actions", async () => {
		const { game, room, userW, userB } = setupGame();

		await selectAndMove(game, room, userW, 'W', 'e2', 'e4');
		await selectAndMove(game, room, userB, 'B', 'e7', 'e5');
		await selectAndMove(game, room, userW, 'W', 'f1', 'Bc4');
		await selectAndMove(game, room, userB, 'B', 'b8', 'Nc6');
		await selectAndMove(game, room, userW, 'W', 'd1', 'Qh5');
		await selectAndMove(game, room, userB, 'B', 'g8', 'Nf6');
		await selectAndMove(game, room, userW, 'W', 'h5', 'Qxf7#');

		expect(game.winCtx).toBeDefined();
		expect(game.winCtx?.type).toBe('win');
	});

	it('renders the final state after checkmate', async () => {
		const { game, room, userW, userB } = setupGame();

		await selectAndMove(game, room, userW, 'W', 'e2', 'e4');
		await selectAndMove(game, room, userB, 'B', 'e7', 'e5');
		await selectAndMove(game, room, userW, 'W', 'f1', 'Bc4');
		await selectAndMove(game, room, userB, 'B', 'b8', 'Nc6');
		await selectAndMove(game, room, userW, 'W', 'd1', 'Qh5');
		await selectAndMove(game, room, userB, 'B', 'g8', 'Nf6');
		await selectAndMove(game, room, userW, 'W', 'h5', 'Qxf7#');

		expect(() => game.render('W')).not.toThrow();
		expect(() => game.render('B')).not.toThrow();
		expect(() => game.render(null)).not.toThrow();
	});
});
