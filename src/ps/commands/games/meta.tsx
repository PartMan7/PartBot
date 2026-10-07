import { PSGames } from '@/cache';
import { prefix } from '@/config/ps';
import { Games } from '@/ps/games';
import { renderBackups, renderMenu } from '@/ps/games/menus';
import { ChatError } from '@/utils/chatError';
import { Button } from '@/utils/components/ps';
import { toId } from '@/utils/toId';

import type { PSMessageTranslated, TranslationFn } from '@/i18n/types';
import type { CommonGame } from '@/ps/games/game';
import type { GamesList } from '@/ps/games/types';
import type { PSCommand } from '@/types/chat';
import type { Room } from 'ps-client';
import type { HTMLopts } from 'ps-client/classes/common';
import type { ReactElement } from 'react';

type ForfeitMessage = Pick<PSMessageTranslated, 'author' | 'reply'> & {
	target: Room & {
		privateHTML: (user: PSMessageTranslated['author'], html: unknown) => void;
		waitFor: (predicate: (msg: PSMessageTranslated) => boolean, timeout: number) => Promise<PSMessageTranslated>;
	};
};

export function getForfeitableGames(roomId: string, userId: string): CommonGame[] {
	return Object.values(PSGames)
		.flatMap(games => Object.values(games ?? {}))
		.filter(game => game.roomid === roomId && game.hasPlayer(userId));
}

export function resolveGameType(input: string): GamesList | null {
	const id = toId(input);
	for (const gameType of Object.keys(Games) as GamesList[]) {
		const { meta } = Games[gameType];
		if (toId(gameType) === id) return gameType;
		if (meta.aliases?.some(alias => toId(alias) === id)) return gameType;
	}
	return null;
}

function findForfeitableGameById(roomId: string, userId: string, specifier: string): CommonGame | null {
	const id = /^#/.test(specifier) ? specifier.toUpperCase() : `#${toId(specifier).toUpperCase()}`;
	return (
		Object.values(PSGames)
			.flatMap(games => Object.values(games ?? {}))
			.find(game => game.id === id && game.roomid === roomId && game.hasPlayer(userId)) ?? null
	);
}

async function confirmForfeit(message: ForfeitMessage, $T: TranslationFn, canFullHTML: () => boolean): Promise<void> {
	message.target.privateHTML(
		message.author,
		<>
			{$T('CONFIRM')}
			{canFullHTML() ? (
				<>
					<br />
					<Button value="confirm">confirm</Button>
				</>
			) : null}
		</>
	);
	await message.target
		.waitFor(msg => toId(msg.content) === 'confirm', 10_000)
		.catch(() => {
			throw new ChatError($T('CANCELLED'));
		});
}

export async function forfeitGame(
	message: ForfeitMessage,
	game: CommonGame,
	$T: TranslationFn,
	canFullHTML: () => boolean,
	{ confirm = true }: { confirm?: boolean } = {}
): Promise<void> {
	if (confirm && game.started) await confirmForfeit(message, $T, canFullHTML);
	const res = game.removePlayer(message.author);
	if (!res.success) throw new ChatError(res.error);
	if (res.data) {
		message.reply(res.data.message);
		if (res.data.cb) res.data.cb();
	}
	if (!game.started) game.signups();
}

async function forfeitGames(
	message: ForfeitMessage,
	games: CommonGame[],
	$T: TranslationFn,
	canFullHTML: () => boolean
): Promise<void> {
	if (!games.length) throw new ChatError($T('GAME.NOT_PLAYING'));
	if (games.some(game => game.started)) await confirmForfeit(message, $T, canFullHTML);
	for (const game of games) await forfeitGame(message, game, $T, canFullHTML, { confirm: false });
}

export const command: PSCommand[] = [
	{
		name: 'games',
		help: 'Metacommands for games.',
		syntax: 'CMD [menu]',
		perms: Symbol.for('games.create'),
		categories: ['game'],
		extendedAliases: {
			backups: ['games', 'backups'],
			bu: ['games', 'backups'],
			howtoplay: ['games', 'howtoplay'],
			htp: ['games', 'howtoplay'],
		},
		async run({ run }) {
			return run('games menu');
		},
		children: {
			menu: {
				name: 'menu',
				aliases: ['list', 'm'],
				help: 'Displays a menu of all games currently active.',
				syntax: 'CMD',
				async run({ message, broadcastHTML }) {
					const Menu = ({ staff }: { staff?: boolean }): ReactElement => (
						<>
							<hr />
							{Object.values(Games)
								.filter(
									Game => Object.values(PSGames[Game.meta.id] ?? {}).filter(game => game.room.id === message.target.id).length > 0
								)
								.map(Game => (
									<details key={Game.meta.id} open={Game.meta.players === 'many'}>
										<summary>
											<h3 style={{ margin: 4, display: 'inline-block', verticalAlign: 'middle' }}>{Game.meta.name}</h3>
										</summary>
										<br />
										{renderMenu(message.target, Game.meta, !!staff)}
									</details>
								))
								.space(<hr />)}
							<br />
							<hr />
						</>
					);
					const opts: HTMLopts = { name: 'games-menu' };
					broadcastHTML(<Menu />, opts);
					message.target.sendHTML(<Menu staff />, { ...opts, rank: '%' });
				},
			},
			howtoplay: {
				name: 'howtoplay',
				aliases: ['htp'],
				help: 'Shows the how-to-play for a game.',
				syntax: 'CMD [game]',
				async run({ arg, run }) {
					return run(`${arg} htp`);
				},
			},
			backups: {
				name: 'backups',
				aliases: ['bu'],
				help: 'Shows all active backups.',
				syntax: 'CMD',
				async run({ message }) {
					const HTML = renderBackups(message.target, 'all');
					message.sendHTML(HTML, { name: `all-backups` });
				},
			},
		},
	},
	{
		name: 'forfeit',
		aliases: ['f', 'ff', 'leave', 'l', 'resign', 'flipboard'],
		help: 'Forfeits games you are in (by id, type, or all).',
		syntax: 'CMD [all?] [game type or #id?]',
		categories: ['game'],
		flags: { routePMs: true },
		async run({ message, arg, $T, canFullHTML }) {
			const roomId = message.target.id;
			const userId = message.author.id;
			const trimmed = arg.trim();
			const [first = '', ...rest] = trimmed.split(/\s+/);

			if (!first) {
				const games = getForfeitableGames(roomId, userId);
				if (games.length === 1) return forfeitGame(message, games[0], $T, canFullHTML);
				if (!games.length) throw new ChatError($T('GAME.NOT_PLAYING'));
				throw new ChatError($T('GAME.FORFEIT_SPECIFY', { prefix }));
			}

			if (toId(first) === 'all') {
				let games = getForfeitableGames(roomId, userId);
				const typeToken = rest[0];
				if (typeToken) {
					const gameType = resolveGameType(typeToken);
					if (!gameType) throw new ChatError($T('GAME.FORFEIT_UNKNOWN_TYPE', { game: typeToken }));
					games = games.filter(game => game.meta.id === gameType);
				}
				return forfeitGames(message, games, $T, canFullHTML);
			}

			if (first.startsWith('#')) {
				const game = findForfeitableGameById(roomId, userId, first);
				if (!game) throw new ChatError($T('GAME.NOT_FOUND'));
				return forfeitGame(message, game, $T, canFullHTML);
			}

			const gameType = resolveGameType(first);
			if (!gameType) throw new ChatError($T('GAME.FORFEIT_UNKNOWN_TYPE', { game: first }));

			const games = getForfeitableGames(roomId, userId).filter(game => game.meta.id === gameType);
			if (games.length === 1) return forfeitGame(message, games[0], $T, canFullHTML);
			if (!games.length) throw new ChatError($T('GAME.NOT_FOUND'));
			throw new ChatError($T('GAME.FORFEIT_TYPE_SPECIFY', { prefix, game: gameType }));
		},
	},
];
