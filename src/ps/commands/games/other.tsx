import { addUGOPoints, getUGOPlayed, setUGOPlayed } from '@/cache/ugo';
import { getScrabbleDex } from '@/database/games';
import { IS_ENABLED } from '@/enabled';
import { i18n } from '@/i18n';
import { getLanguage } from '@/i18n/language';
import { Board } from '@/ps/commands/points';
import { Games } from '@/ps/games';
import { parseMod } from '@/ps/games/mods';
import { Small } from '@/ps/games/render';
import { checkWord } from '@/ps/games/scrabble/checker';
import { ScrabbleMods } from '@/ps/games/scrabble/constants';
import { ScrabbleModData } from '@/ps/games/scrabble/mods';
import { TOKEN_TYPE } from '@/ps/games/splendor/constants';
import metadata from '@/ps/games/splendor/metadata.json';
import { ArtOnlyCard, PokemonCard, TrainerCard } from '@/ps/games/splendor/render';
import { LB_STYLES } from '@/ps/other/leaderboardStyles';
import { isUGOActive } from '@/ps/specialEvents';
import { BOARD_GAMES_STRUCHNI_ORDER, CHAIN_REACTION_META } from '@/ps/specialEvents/constants';
import { ChatError } from '@/utils/chatError';
import { Username } from '@/utils/components';
import { mapValues } from '@/utils/map';
import { pluralize } from '@/utils/pluralize';
import { rankedSort } from '@/utils/rankedSort';
import { toId } from '@/utils/toId';

import type { UGOUserPoints } from '@/cache/ugo';
import type { ScrabbleDexEntry } from '@/database/games';
import type { TranslationFn } from '@/i18n/types';
import type { Card, Trainer } from '@/ps/games/splendor/types';
import type { GamesList } from '@/ps/games/types';
import type { PSCommand } from '@/types/chat';
import type { ReactElement } from 'react';

export function renderScrabbleDexLeaderboard(entries: ScrabbleDexEntry[], $T: TranslationFn): ReactElement {
	const usersData = Object.values(entries.groupBy(entry => entry.by) as Record<string, ScrabbleDexEntry[]>).map(entries => {
		const name = entries.findLast(entry => entry.byName)?.byName ?? entries[0].by;
		const uniqueMons = entries.map(entry => entry.pokemonName).unique();
		const count = uniqueMons.length;
		const points = uniqueMons.map(mon => Math.max(1, mon.length - 4)).sum();
		return { name, count, points };
	});
	const sortedData = rankedSort(
		usersData,
		({ count, points }) => [points, count],
		({ name, count, points }) => [name, count, points]
	);
	return (
		<Board
			headers={['#', $T('COMMANDS.POINTS.HEADERS.USER'), 'Unique', 'Points']}
			data={sortedData}
			asPage
			styles={LB_STYLES.orange}
		/>
	);
}

export function renderUGOBoardGamesLeaderboard(data: Record<string, UGOUserPoints>, $T: TranslationFn): ReactElement {
	const sortedData = rankedSort(
		Object.entries(data),
		([_name, entry]) => entry.total,
		([name, entry]) => [
			name,
			entry.total,
			Object.values(entry.breakdown)
				.map(num => num ?? 0)
				.sum(),
			...BOARD_GAMES_STRUCHNI_ORDER.map(gameId => entry.breakdown[gameId] ?? 0),
			entry.breakdown.event ?? 0,
		]
	).slice(0, 30);
	return (
		<center>
			<div style={{ margin: 48, overflowX: 'auto' }}>
				<Board
					headers={[
						'#',
						$T('COMMANDS.POINTS.HEADERS.USER'),
						'Points',
						'Total Points',
						...BOARD_GAMES_STRUCHNI_ORDER.map(gameId =>
							gameId in Games
								? (Games[gameId as GamesList].meta.abbr ?? Games[gameId as GamesList].meta.name)
								: CHAIN_REACTION_META.abbr
						),
						'Event',
					]}
					data={sortedData}
					asPage
					style={{ width: 640 }}
					styles={LB_STYLES.orange}
				/>
			</div>
		</center>
	);
}

export const command: PSCommand[] = [
	{
		name: 'checkword',
		help: 'Checks the legality of a word according to the Scrabble dictionary.',
		syntax: 'CMD word[, mod]',
		flags: { allowPMs: true },
		aliases: ['cw'],
		categories: ['game'],
		async run({ broadcast, arg, $T }) {
			const [word, input = ScrabbleMods.CSW24] = arg
				.toLowerCase()
				.replace(/[^a-z0-9,]/g, '')
				.lazySplit(',', 1);
			const mod = parseMod(input, ScrabbleMods, ScrabbleModData);
			if (!mod) throw new ChatError($T('GAME.MOD_NOT_FOUND', { mod: input }));
			const check = checkWord(word, mod);
			if (!check) broadcast($T('GAME.SCRABBLE.INVALID_WORD', { wordList: word }));
			else broadcast($T('GAME.SCRABBLE.VALID_WORD', { word: toId(word).toUpperCase(), mod: ScrabbleModData[mod].name }));
		},
	},
	{
		name: 'othellosequence',
		help: 'Sequence of fastest game in Othello.',
		syntax: 'CMD',
		categories: ['game'],
		async run({ broadcastHTML }) {
			broadcastHTML([['e6', 'f4'], ['e3', 'f6'], ['g5', 'd6'], ['e7', 'f5'], ['c5']].map(turns => turns.join(', ')).join('<br />'));
		},
	},
	{
		name: 'cardinfo',
		aliases: ['card'],
		extendedAliases: { 'splendor cardinfo': ['cardinfo'], 'splendor card': ['cardinfo'] },
		help: 'Shows the card info for a Splendor card.',
		syntax: 'CMD [card name]',
		categories: ['game'],
		async run({ message, broadcastHTML, arg, $T }) {
			const id = toId(arg);
			if (id === 'constructor') throw new ChatError($T('SCREW_YOU'));
			if (id in metadata.pokemon) {
				const card = metadata.pokemon[id];
				const attr = card.attr ? [metadata.artists[card.attr]] : [];
				const afdArtist = 'audiino';
				if (attr[0]?.id !== afdArtist) attr.push(metadata.artists[afdArtist]);
				broadcastHTML(
					<>
						<Small>
							<PokemonCard data={card} />
							<ArtOnlyCard data={card} />
							<ArtOnlyCard data={card} afd />
						</Small>
						{attr.map((artist, isAfd) => (
							<>
								{isAfd ? 'April Fools' : ''} Art by <Username name={artist.name} clickable />!
								{artist.url ? (
									<>
										{' '}
										Check them out at <a href={artist.url}>{artist.url}</a>!
									</>
								) : null}
							</>
						)).space(<br />)}
					</>
				);
			} else if (id in metadata.trainers) {
				const card = metadata.trainers[id];
				broadcastHTML(
					<Small>
						<TrainerCard data={card} />
					</Small>
				);
			} else if (id === message.parent.status.userid) {
				const card: Trainer = {
					id,
					name: message.parent.status.username ?? '-',
					points: 15,
					types: { [TOKEN_TYPE.DRAGON]: 4 },
					art: 'https://play.pokemonshowdown.com/sprites/trainers/supernerd.png',
				};
				broadcastHTML(
					<Small>
						<TrainerCard data={card} />
					</Small>
				);
			} else throw new ChatError($T('ENTRY_NOT_FOUND'));
		},
	},
	{
		name: 'splendorart',
		help: 'Displays the current user-made art used in Splendor!',
		syntax: 'CMD',
		flags: { allowPMs: true },
		extendedAliases: { 'splendor art': ['splendorart'] },
		categories: ['game'],
		async run({ broadcastHTML }) {
			const customCards = Object.values(metadata.pokemon).filter(mon => mon.attr);
			const groupedInfo = customCards.groupBy(card => card.attr!);
			return broadcastHTML(
				<>
					<h3>Shoutouts to these nerds for setting up some amazing art for Splendor!</h3>
					{Object.entries(groupedInfo).map(([attr, _cards]) => {
						const artist = metadata.artists[attr];
						// Audiino did all the AFD cards
						const cards: (Card & { afd?: boolean })[] =
							artist.id === 'audiino' ? _cards!.concat(customCards.map(card => ({ ...card, afd: true }))) : _cards!;
						return (
							<details open>
								<summary>
									<Username name={artist.name} />
									{artist.url ? (
										<>
											{' '}
											(<a href={artist.url}>check them out</a>!)
										</>
									) : null}
								</summary>
								<div style={{ zoom: '40%', overflowX: 'auto', whiteSpace: 'nowrap' }}>
									{cards.map(card => (
										<ArtOnlyCard data={card} afd={card.afd} />
									))}
								</div>
							</details>
						);
					})}
				</>
			);
		},
	},
	// UGO-CODE
	{
		name: 'scrabbledex',
		help: "Shows a user's current ScrabbleDex for UGO.",
		syntax: 'CMD [user?]',
		flags: { allowPMs: true },
		categories: ['game'],
		children: {
			leaderboard: {
				name: 'leaderboard',
				help: 'Shows the current ScrabbleDex leaderboard for UGO.',
				syntax: 'CMD',
				aliases: ['board', 'lb', 'top'],
				async run({ message, $T }) {
					if (!IS_ENABLED.DB) throw new ChatError($T('DISABLED.DB'));
					const entries = await getScrabbleDex();
					message.author.pageHTML(renderScrabbleDexLeaderboard(entries!, $T), { name: 'scrabbledex' });
				},
			},
		},
		async run({ message, broadcastHTML, arg, $T }) {
			if (!IS_ENABLED.DB) throw new ChatError($T('DISABLED.DB'));
			const target = toId(arg) || message.author.id;
			const allEntries = await getScrabbleDex();
			const results = allEntries!.filter(entry => entry.by === target);
			const grouped = mapValues(
				results.map(res => res.pokemonName.toUpperCase()).groupBy(mon => toId(mon).length),
				mons => mons?.unique().sort()
			);
			const count = Object.values(grouped)
				.map(num => num?.length ?? 0)
				.sum();

			if (!results.length) throw new ChatError($T('GAME.SCRABBLEDEX_NO_ENTRIES'));

			broadcastHTML(
				<details>
					<summary>ScrabbleDex ({count} entries)</summary>
					{Object.entries(grouped).filterMap(([length, mons]) => {
						if (mons)
							return (
								<p>
									{length} ({mons.length}): {mons.sort().list($T)}
								</p>
							);
					})}
				</details>,
				{ name: `scrabbledex-${message.author.id}` }
			);
		},
	},
	// UGO-CODE
	{
		name: 'ugoexternal',
		help: 'Adds points for external UGO games.',
		syntax: 'CMD [winner], [...others]',
		flags: { allowPMs: true, pmOnly: true },
		perms: message => message.author.id === 'partprofessor',
		categories: ['game'],
		async run({ arg, message, $T }) {
			if (!isUGOActive()) throw new ChatError($T('GAME.UGO_NOT_ACTIVE'));
			const players = arg.split(',');
			const winner = players[0];

			const pointsData = Object.fromEntries(
				players
					.filter(player => {
						const prevCount = getUGOPlayed(CHAIN_REACTION_META.id, player);
						setUGOPlayed(CHAIN_REACTION_META.id, player, prevCount + 1);
						return prevCount <= CHAIN_REACTION_META.ugo.cap;
					})
					.map(player => [
						player.trim(),
						player === winner ? CHAIN_REACTION_META.ugo.points.win(players.length) : CHAIN_REACTION_META.ugo.points.loss,
					])
			);

			addUGOPoints.call(message.parent, pointsData, CHAIN_REACTION_META.id);
		},
	},
	// UGO-CODE
	{
		name: 'addugopoints',
		help: 'Adds event points for UGO. These points will not count for the Struchni system.',
		syntax: 'CMD [amount], [...users]',
		categories: ['game'],
		flags: { allowPMs: true },
		perms: message => {
			function isStaff(userString: string): boolean {
				return /^[%@*#]/.test(userString);
			}
			const userInRoom = message.parent.getRoom('Board Games')?.users.find(user => toId(user) === message.author.id);
			const $T = i18n(getLanguage(message.target));
			if (!userInRoom) throw new ChatError($T('NOT_IN_ROOM'));
			return isStaff(userInRoom);
		},
		async run({ message, broadcast, arg, $T }) {
			const [_amount, _user = ''] = arg.lazySplit(',', 1);
			const amount = +_amount > 0 || +_amount < 0 ? +_amount : +_user > 0 || +_user < 0 ? +_user : null;
			const user = +_amount > 0 || +_amount < 0 ? _user.trim() : +_user > 0 || +_user < 0 ? _amount.trim() : null;
			if (!amount || !user) throw new ChatError($T('INVALID_ARGUMENTS'));
			const users = user.split(',').map(name => name.trim());
			if (users.some(name => name === 'constructor')) throw new ChatError($T('SCREW_YOU'));

			addUGOPoints.bind(message.parent)(Object.fromEntries(users.map(name => [name, amount])), 'event');

			const log = $T('COMMANDS.POINTS.ADDED_POINTS_TO_USERS', {
				pointsText: pluralize(amount, { singular: 'UGO Event Point', plural: 'UGO Event Points' }),
				users: users.list($T),
			});
			broadcast(log);
			message.parent.getRoom('Board Games').send(`/modnote ${log}`);
		},
	},
];
