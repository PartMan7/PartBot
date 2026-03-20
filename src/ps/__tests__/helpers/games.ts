import { jsxToHTML } from '@/utils/jsxToHTML';

import type { BaseLookup, TranslationFn } from '@/i18n/types';
import type { MockRoom } from '@/ps/__tests__/mocks/room';
import type { MockUser } from '@/ps/__tests__/mocks/user';
import type { BaseContext, CommonGame } from '@/ps/games/game';
import type { Meta } from '@/ps/games/types';
import type { ReactElement } from 'react';

/**
 * A mock translation function that returns a deterministic string for each key and variable set.
 * Satisfies the TranslationFn contract by casting.
 */
export const mockT = (<Lookup extends BaseLookup>(key: Lookup, vars?: Record<string, string | number | undefined>) =>
	vars ? `${key}:${JSON.stringify(vars)}` : key) as unknown as TranslationFn;

export function createGame<G extends CommonGame>(
	GameClass: { new (ctx: BaseContext): G },
	gameMeta: Meta,
	room: MockRoom,
	creator: MockUser,
	opts: { id?: string; args?: string[] } = {}
): G {
	return new GameClass({
		id: opts.id ?? '#TEST',
		meta: gameMeta,
		room,
		$T: mockT,
		args: opts.args ?? [],
		by: creator,
	});
}

/** Subcommand aliases for the "play" action used in game button values. */
const PLAY_SUBCOMMANDS = new Set(['play', 'p', '!']);

/**
 * Parses a rendered game page HTML and returns the game-specific action strings
 * from all "play" action buttons — the move portion after the game id in
 * `,<gameid> play [id], [move]` (see `runGamePlayCommand`).
 *
 * A play button value has the shape:
 *   `${game.msg} ${playAlias} ${gameCtx}`
 * e.g. `/msgroom boardgames,/botmsg partbot,,@#TEST ! select e2`
 *
 * The returned action strings are just the `gameCtx` part, e.g. `select e2`.
 */
export function getButtonActions(element: ReactElement, game: CommonGame): string[] {
	const html = jsxToHTML(element);
	const msgPrefix = game.msg + ' ';
	const actions: string[] = [];

	// Match all <button name="send" value="..."> occurrences in either attribute order.
	const patterns = [/<button[^>]+name="send"[^>]+value="([^"]*)"/gi, /<button[^>]+value="([^"]*)"[^>]+name="send"/gi];

	const seen = new Set<string>();
	for (const pattern of patterns) {
		let match: RegExpExecArray | null;
		while ((match = pattern.exec(html)) !== null) {
			const raw = match[1];
			if (seen.has(raw)) continue;
			seen.add(raw);

			if (!raw.startsWith(msgPrefix)) continue;
			const rest = raw.slice(msgPrefix.length);

			const spaceIdx = rest.indexOf(' ');
			const subcommand = spaceIdx >= 0 ? rest.slice(0, spaceIdx) : rest;
			const gameCtx = spaceIdx >= 0 ? rest.slice(spaceIdx + 1) : '';

			if (PLAY_SUBCOMMANDS.has(subcommand)) actions.push(gameCtx);
		}
	}

	return actions;
}
