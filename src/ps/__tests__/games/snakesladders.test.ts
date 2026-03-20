import { describe, expect, it, vi } from 'vitest';

vi.mock('@/cache/games', () => ({
	gameCache: { set: vi.fn(), delete: vi.fn(), get: vi.fn(), getByGame: vi.fn(), clearOldBackups: vi.fn() },
}));

import { runGamePlayCommand } from '@/ps/__tests__/helpers/commands';
import { createGame, getButtonActions } from '@/ps/__tests__/helpers/games';
import { client } from '@/ps/__tests__/mocks/client';
import { mockRoom } from '@/ps/__tests__/mocks/room';
import { mockUser } from '@/ps/__tests__/mocks/user';
import { SnakesLadders } from '@/ps/games/snakesladders';
import { meta } from '@/ps/games/snakesladders/meta';
import { useRNG } from '@/utils/random';

function setupGame(seed?: number) {
	const room = mockRoom('boardgames', client);
	const game = createGame(SnakesLadders, meta, room, mockUser('Tester'));
	const userA = mockUser('PlayerA');
	const userB = mockUser('PlayerB');
	game.addPlayer(userA, null);
	game.addPlayer(userB, null);

	if (seed !== undefined) {
		game.seed = seed;
		const prng = useRNG(seed);
		game.prng = () => {
			game.prngCalls++;
			return prng();
		};
	}

	game.start();
	return {
		game,
		room,
		users: new Map<string, ReturnType<typeof mockUser>>([
			[userA.id, userA],
			[userB.id, userB],
		]),
	};
}

describe('SnakesLadders playthrough', () => {
	it('plays a full game using only the roll button', async () => {
		const { game, room, users } = setupGame(42);

		// A Snakes & Ladders game with 2 players terminates in well under 500 rolls.
		const MAX_ROLLS = 500;
		let rolls = 0;

		while (!game.winCtx && rolls++ < MAX_ROLLS) {
			const turn = game.turn!;
			const user = users.get(turn)!;
			expect(user, `No user found for turn "${turn}"`).toBeDefined();

			// The roll button has an empty game ctx (just the "!" play alias).
			const actions = getButtonActions(game.render(turn), game);
			expect(actions, 'Expected the roll button to be present').toContain('');

			await runGamePlayCommand(game, user, room, '');
		}

		expect(rolls, 'Game should end within the maximum number of rolls').toBeLessThanOrEqual(MAX_ROLLS);
		expect(game.winCtx).toBeDefined();
		expect(game.winCtx?.type).toBe('win');
	});

	it('renders the final state after game ends', async () => {
		const { game, room, users } = setupGame(99);

		let rolls = 0;
		while (!game.winCtx && rolls++ < 500) {
			const user = users.get(game.turn!)!;
			await runGamePlayCommand(game, user, room, '');
		}

		expect(() => game.render(game.turn)).not.toThrow();
		expect(() => game.render(null)).not.toThrow();
	});
});
