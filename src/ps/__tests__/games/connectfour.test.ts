import { describe, expect, it, vi } from 'vitest';

vi.mock('@/cache/games', () => ({
	gameCache: { set: vi.fn(), delete: vi.fn(), get: vi.fn(), getByGame: vi.fn(), clearOldBackups: vi.fn() },
}));

import { runGamePlayCommand } from '@/ps/__tests__/helpers/commands';
import { createGame, getButtonActions } from '@/ps/__tests__/helpers/games';
import { client } from '@/ps/__tests__/mocks/client';
import { mockRoom } from '@/ps/__tests__/mocks/room';
import { mockUser } from '@/ps/__tests__/mocks/user';
import { ConnectFour } from '@/ps/games/connectfour';
import { meta } from '@/ps/games/connectfour/meta';

function setupGame() {
	const room = mockRoom('boardgames', client);
	const game = createGame(ConnectFour, meta, room, mockUser('Alice'));
	const userY = mockUser('Yellow');
	const userR = mockUser('Red');
	game.addPlayer(userY, 'Y');
	game.addPlayer(userR, 'R'); // auto-starts
	return { game, room, userY, userR };
}

describe('ConnectFour playthrough', () => {
	/**
	 * Yellow wins horizontally at the bottom row:
	 * Y col 0, R col 4, Y col 1, R col 5, Y col 2, R col 6, Y col 3 → Y wins
	 */
	it('plays a full game using only HTML button actions', async () => {
		const { game, room, userY, userR } = setupGame();

		const moves: Array<{ turn: 'Y' | 'R'; user: ReturnType<typeof mockUser>; col: string }> = [
			{ turn: 'Y', user: userY, col: '0' },
			{ turn: 'R', user: userR, col: '4' },
			{ turn: 'Y', user: userY, col: '1' },
			{ turn: 'R', user: userR, col: '5' },
			{ turn: 'Y', user: userY, col: '2' },
			{ turn: 'R', user: userR, col: '6' },
			{ turn: 'Y', user: userY, col: '3' },
		];

		for (const { turn, user, col } of moves) {
			expect(game.winCtx, `Expected no winner yet before move on col ${col}`).toBeUndefined();
			expect(game.turn).toBe(turn);

			const actions = getButtonActions(game.render(turn), game);
			expect(actions, `Expected col ${col} to be a valid action for ${turn}`).toContain(col);

			await runGamePlayCommand(game, user, room, col);
		}

		expect(game.winCtx).toBeDefined();
		expect(game.winCtx?.type).toBe('win');
	});

	it('renders the final state after game ends', async () => {
		const { game, room, userY, userR } = setupGame();
		await runGamePlayCommand(game, userY, room, '0');
		await runGamePlayCommand(game, userR, room, '4');
		await runGamePlayCommand(game, userY, room, '1');
		await runGamePlayCommand(game, userR, room, '5');
		await runGamePlayCommand(game, userY, room, '2');
		await runGamePlayCommand(game, userR, room, '6');
		await runGamePlayCommand(game, userY, room, '3');

		// After the game ends, both perspectives must still render without errors
		expect(() => game.render('Y')).not.toThrow();
		expect(() => game.render('R')).not.toThrow();
		expect(() => game.render(null)).not.toThrow();
	});
});
