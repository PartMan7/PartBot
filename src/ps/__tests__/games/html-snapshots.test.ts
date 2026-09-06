import path from 'node:path';
import { format } from 'prettier';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { i18n } from '@/i18n';
import { client } from '@/ps/__tests__/mocks/client';
import { mockRoom } from '@/ps/__tests__/mocks/room';
import { mockUser } from '@/ps/__tests__/mocks/user';
import { GamesList } from '@/ps/games/types';
import { jsxToHTML } from '@/utils/jsxToHTML';

import type { Games } from '@/ps/games';
import type { BaseContext, CommonGame } from '@/ps/games/game';

type GameConstructor = new (ctx: BaseContext) => CommonGame;

function withFixedRandom<T>(callback: () => T): T {
	const random = vi.spyOn(Math, 'random').mockReturnValue(0.5);
	try {
		return callback();
	} finally {
		random.mockRestore();
	}
}

function htmlDocument(title: string, playerHTML: string, spectatorHTML: string): string {
	return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>${title}</title>
		<style>
			body { margin: 0; padding: 16px; background: #546bac; }
			#page { max-width: 900px; padding: 12px; background: #000a; color: white; }
			.view { margin: 16px 0; }
		</style>
	</head>
	<body>
		<main id="page">
			<section class="view">
				<h2>Player view</h2>
				${playerHTML}
			</section>
			<hr />
			<section class="view">
				<h2>Spectator view</h2>
				${spectatorHTML}
			</section>
		</main>
	</body>
</html>
`;
}

function createSnapshot(name: GamesList, games: Games): { game: CommonGame; side: string | null } {
	const { meta, instance } = games[name];
	const room = mockRoom('boardgames', client);
	const creator = mockUser(`${meta.name} Snapshot Creator`);
	const game = new (instance as GameConstructor)({
		id: `#SNAPSHOT-${name.toUpperCase()}`,
		meta,
		room,
		$T: i18n(),
		args: [],
		by: creator,
	});

	if (meta.players === 'many') {
		const turns = meta.turns ? Object.keys(meta.turns) : [];
		if (turns.length) {
			turns.forEach(turn => game.addPlayer(mockUser(`${meta.name} ${turn}`), turn));
		} else {
			const playerCount = meta.minSize ?? 2;
			for (let i = 0; i < playerCount; i++) {
				game.addPlayer(mockUser(`${meta.name} Player ${i + 1}`), null);
			}
		}
		if (!game.started) game.start();
	}

	return { game, side: game.turn };
}

describe('Game HTML snapshots', () => {
	let games: Games;

	beforeAll(async () => {
		({ Games: games } = await import('@/ps/games'));
	});

	for (const name of Object.values(GamesList)) {
		it(`renders ${name} as openable HTML`, async () => {
			const html = await withFixedRandom(() => {
				const { game, side } = createSnapshot(name, games);
				return format(htmlDocument(game.meta.name, jsxToHTML(game.render(side)), jsxToHTML(game.render(null))), {
					parser: 'html',
					printWidth: 135,
					useTabs: true,
				});
			});
			await expect(html).toMatchFileSnapshot(path.join(__dirname, 'html-snapshots', `${name}.html`));
		});
	}
});
