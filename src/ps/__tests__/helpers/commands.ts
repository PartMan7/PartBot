import { mockT } from '@/ps/__tests__/helpers/games';
import { command as gameTopLevelCommands } from '@/ps/commands/games/core';

import type { PSMessageTranslated } from '@/i18n/types';
import type { MockRoom } from '@/ps/__tests__/mocks/room';
import type { MockUser } from '@/ps/__tests__/mocks/user';
import type { CommonGame } from '@/ps/games/game';
import type { PSCommandContext } from '@/types/chat';
import type { PSMessage } from '@/types/ps';

export type { mockT };

/**
 * Builds a minimal PSCommandContext for unit-testing individual PS commands.
 */
export function buildCommandContext(user: MockUser, room: MockRoom, overrides: Partial<PSCommandContext> = {}): PSCommandContext {
	const message = {
		author: user,
		target: room,
		type: 'chat',
		reply: () => null,
		privateReply: () => null,
		replyHTML: () => null,
		sendHTML: () => null,
	} as unknown as PSMessageTranslated;

	return {
		$T: mockT,
		args: [],
		arg: '',
		rawArgs: [],
		command: [],
		originalCommand: [],
		message: message as unknown as PSMessage,
		run: async () => undefined,
		unsafeRun: async () => undefined,
		broadcast: () => null,
		broadcastHTML: () => null,
		checkPermissions: () => false,
		hasFeature: () => null,
		...overrides,
	} as unknown as PSCommandContext;
}

/**
 * Runs a PSCommand's `run()` method with a pre-built context.
 */
export async function runCommand(
	run: (ctx: PSCommandContext & { message: PSMessage }) => Promise<unknown>,
	user: MockUser,
	room: MockRoom,
	overrides: Partial<PSCommandContext> = {}
): Promise<void> {
	const ctx = buildCommandContext(user, room, overrides);
	await run(ctx as PSCommandContext & { message: PSMessage });
}

/**
 * Performs a move the same way chat does: the game module's `play` handler with
 * `arg` shaped like `[id], [move]` (e.g. `,connectfour play #TEST, 3`).
 */
export async function runGamePlayCommand(game: CommonGame, user: MockUser, room: MockRoom, moveCtx: string): Promise<void> {
	const playRun = gameTopLevelCommands.find(c => c.name === game.meta.id)?.children?.play?.run;
	if (!playRun) throw new Error(`No play subcommand for game ${game.meta.id}`);
	const arg = moveCtx ? `${game.id}, ${moveCtx}` : `${game.id},`;
	await runCommand(playRun, user, room, { arg });
}
