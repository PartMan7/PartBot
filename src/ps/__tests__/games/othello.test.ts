import { describe, expect, it, vi } from 'vitest';

vi.mock('@/cache/games', () => ({
	gameCache: { set: vi.fn(), delete: vi.fn(), get: vi.fn(), getByGame: vi.fn(), clearOldBackups: vi.fn() },
}));

import { runGamePlayCommand } from '@/ps/__tests__/helpers/commands';
import { createGame, getButtonActions } from '@/ps/__tests__/helpers/games';
import { client } from '@/ps/__tests__/mocks/client';
import { mockRoom } from '@/ps/__tests__/mocks/room';
import { asPsUser, mockUser } from '@/ps/__tests__/mocks/user';
import { Othello } from '@/ps/games/othello';
import { meta } from '@/ps/games/othello/meta';

function setupGame() {
	const room = mockRoom('boardgames', client);
	const game = createGame(Othello, meta, room, mockUser('Alice'));
	const userW = mockUser('White');
	const userB = mockUser('Black');
	game.addPlayer(userW, 'W');
	game.addPlayer(userB, 'B'); // auto-starts
	return { game, room, userW, userB, users: { W: userW, B: userB } };
}

describe('Othello playthrough', () => {
	it('plays a full game using only HTML button actions', async () => {
		const { game, room, users } = setupGame();

		let safeguard = 0;
		const MAX_MOVES = 64;

		while (!game.winCtx && safeguard++ < MAX_MOVES) {
			const turn = game.turn as 'W' | 'B';
			const user = users[turn];

			const actions = getButtonActions(game.render(turn), game);
			expect(actions.length, `Expected at least one valid action for ${turn}`).toBeGreaterThan(0);

			// Play the first available valid move
			const [move] = actions;
			await runGamePlayCommand(game, user, room, move);
		}

		expect(safeguard, 'Game should end within the maximum number of moves').toBeLessThanOrEqual(MAX_MOVES);
		expect(game.winCtx).toBeDefined();
	});

	it('renders the final state after game ends', async () => {
		const { game, room, userW, userB } = setupGame();

		let safeguard = 0;
		while (!game.winCtx && safeguard++ < 64) {
			const turn = game.turn as 'W' | 'B';
			const user = turn === 'W' ? userW : userB;
			const [action] = getButtonActions(game.render(turn), game);
			await runGamePlayCommand(game, user, room, action);
		}

		expect(() => game.render('W')).not.toThrow();
		expect(() => game.render('B')).not.toThrow();
		expect(() => game.render(null)).not.toThrow();
	});

	it('allows both players to sub after moves have been played', async () => {
		const { game, room, users } = setupGame();
		const replacementW = mockUser('Replacement White');
		const replacementB = mockUser('Replacement Black');

		for (let move = 0; move < 2; move++) {
			const turn = game.turn as 'W' | 'B';
			await runGamePlayCommand(game, users[turn], room, getButtonActions(game.render(turn), game)[0]);
		}

		expect(game.replacePlayer('W', asPsUser(replacementW)).success).toBe(true);
		expect(game.replacePlayer('B', asPsUser(replacementB)).success).toBe(true);
		expect(game.players.W.id).toBe(replacementW.id);
		expect(game.players.B.id).toBe(replacementB.id);
	});
});
