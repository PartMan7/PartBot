import { describe, expect, it, vi } from 'vitest';

vi.mock('@/cache/games', () => ({
	gameCache: { set: vi.fn(), delete: vi.fn(), get: vi.fn(), getByGame: vi.fn(), clearOldBackups: vi.fn() },
}));

import { runGamePlayCommand } from '@/ps/__tests__/helpers/commands';
import { createGame, getButtonActions } from '@/ps/__tests__/helpers/games';
import { client } from '@/ps/__tests__/mocks/client';
import { mockRoom } from '@/ps/__tests__/mocks/room';
import { asPsUser, mockUser } from '@/ps/__tests__/mocks/user';
import { ConnectFour } from '@/ps/games/connectfour';
import { meta } from '@/ps/games/connectfour/meta';

function setupGame() {
	const room = mockRoom('boardgames', client);
	const game = createGame(ConnectFour, meta, room, mockUser('Alice'));
	const userP1 = mockUser('Player One');
	const userP2 = mockUser('Player Two');
	game.addPlayer(userP1, 'P1');
	game.addPlayer(userP2, 'P2'); // auto-starts
	return { game, room, userP1, userP2 };
}

describe('ConnectFour playthrough', () => {
	it('assigns distinct type discs from player colours on start', () => {
		const { game } = setupGame();
		expect(game.state.discs.P1.imageUrl).toContain('/static/types/');
		expect(game.state.discs.P2.imageUrl).toContain('/static/types/');
		expect(game.state.discs.P1.name).not.toBe(game.state.discs.P2.name);
		expect(game.state.discs.P1.bgHex).not.toBe(game.state.discs.P2.bgHex);
	});

	/**
	 * P1 wins horizontally at the bottom row:
	 * P1 col 0, P2 col 4, P1 col 1, P2 col 5, P1 col 2, P2 col 6, P1 col 3 → P1 wins
	 */
	it('plays a full game using only HTML button actions', async () => {
		const { game, room, userP1, userP2 } = setupGame();

		const moves: Array<{ turn: 'P1' | 'P2'; user: ReturnType<typeof mockUser>; col: string }> = [
			{ turn: 'P1', user: userP1, col: '0' },
			{ turn: 'P2', user: userP2, col: '4' },
			{ turn: 'P1', user: userP1, col: '1' },
			{ turn: 'P2', user: userP2, col: '5' },
			{ turn: 'P1', user: userP1, col: '2' },
			{ turn: 'P2', user: userP2, col: '6' },
			{ turn: 'P1', user: userP1, col: '3' },
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
		const { game, room, userP1, userP2 } = setupGame();
		await runGamePlayCommand(game, userP1, room, '0');
		await runGamePlayCommand(game, userP2, room, '4');
		await runGamePlayCommand(game, userP1, room, '1');
		await runGamePlayCommand(game, userP2, room, '5');
		await runGamePlayCommand(game, userP1, room, '2');
		await runGamePlayCommand(game, userP2, room, '6');
		await runGamePlayCommand(game, userP1, room, '3');

		// After the game ends, both perspectives must still render without errors
		expect(() => game.render('P1')).not.toThrow();
		expect(() => game.render('P2')).not.toThrow();
		expect(() => game.render(null)).not.toThrow();
	});

	it('does not render clickable columns after a player forfeits', () => {
		const { game, userP1 } = setupGame();

		const result = game.removePlayer(userP1);
		if (!result.success) throw new Error(result.error);
		result.data.cb?.();

		expect(getButtonActions(game.render(null), game)).toHaveLength(0);
	});

	it('allows both players to sub after moves have been played', async () => {
		const { game, room, userP1, userP2 } = setupGame();
		const replacementP1 = mockUser('Replacement One');
		const replacementP2 = mockUser('Replacement Two');

		await runGamePlayCommand(game, userP1, room, '0');
		await runGamePlayCommand(game, userP2, room, '1');

		expect(game.replacePlayer('P1', asPsUser(replacementP1)).success).toBe(true);
		expect(game.replacePlayer('P2', asPsUser(replacementP2)).success).toBe(true);
		expect(game.players.P1.id).toBe(replacementP1.id);
		expect(game.players.P2.id).toBe(replacementP2.id);
	});
});
