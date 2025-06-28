import { PSGames } from '@/cache';
import { gameCache } from '@/cache/games';
import { prefix } from '@/config/ps';
import { i18n } from '@/i18n';
import { getLanguage } from '@/i18n/language';
import { Button, Username } from '@/utils/components/ps';
import { Logger } from '@/utils/logger';

import type { PSRoomTranslated } from '@/i18n/types';
import type { Meta, Player } from '@/ps/games/types';
import type { ReactElement } from 'react';

export function renderMenu(room: PSRoomTranslated, meta: Meta, isStaff: boolean): ReactElement {
	const $T = i18n(getLanguage(room));
	const games = Object.values(PSGames[meta.id] ?? {}).filter(game => game.roomid === room.id);
	if (!games?.length) return <div>{$T('GAME.NO_GAMES_FOUND')}</div>;
	return (
		<>
			{games.map(game => {
				const cmd = game.renderCtx.msg;
				return (
					<div key={game.id}>
						{game.started ? (
							<>
								{Object.values(game.players)
									.map(player => {
										const username = <Username name={player.name} />;
										return player.out ? <s>{username}</s> : username;
									})
									.space('/')}
								<Button value={`${cmd} watch`} style={{ marginLeft: 10 }}>
									{$T('GAME.LABELS.WATCH')}
								</Button>
							</>
						) : game.sides ? (
							game.turns
								.map(turn =>
									game.players[turn] ? (
										<Username name={game.players[turn].name} />
									) : (
										<Button value={`${cmd} join ${turn}`}>{$T('GAME.LABELS.JOIN_SIDE', { side: turn })}</Button>
									)
								)
								.space(' vs ')
						) : (
							<>
								{Object.values(game.players)
									.map(player => <Username name={player.name} />)
									.space(', ')}
								{Object.keys(game.players).length < game.meta.maxSize! ? (
									<Button value={`${cmd} join`} style={{ marginLeft: 10 }}>
										{$T('GAME.LABELS.JOIN')}
									</Button>
								) : null}
							</>
						)}
						{isStaff ? (
							<>
								{game.meta.autostart === false && game.startable() ? (
									<Button value={`${cmd} start ${game.id}`} style={{ marginLeft: 20 }}>
										{$T('GAME.LABELS.START')}
									</Button>
								) : null}
								<Button value={`${cmd} end ${game.id}`} style={{ marginLeft: 20 }}>
									{$T('GAME.LABELS.END')}
								</Button>
								<Button value={`${cmd} stash ${game.id}`} style={{ marginLeft: 20 }}>
									{$T('GAME.LABELS.STASH')}
								</Button>
							</>
						) : null}
						<span style={{ color: 'gray', marginLeft: 20 }}>{game.id}</span>
					</div>
				);
			})}
		</>
	);
}

export function renderBackups(room: PSRoomTranslated, meta: Meta): ReactElement {
	const $T = i18n(getLanguage(room));

	const stashedGames = gameCache
		.getByGame(room.roomid, meta.id)
		.filter(game => !PSGames[meta.id]?.[game.id])
		.sortBy(game => game.at, 'desc');
	return (
		<>
			<hr />
			{stashedGames.length > 0 ? (
				stashedGames.map(game => {
					let parsed: { players: Record<string, Player> };
					try {
						parsed = JSON.parse(game.backup);
					} catch (e) {
						Logger.log(`Unable to parse ${game.backup} in backups`, e);
						return <div>Unable to parse backup for {game.id}</div>;
					}
					const players = Object.values(parsed.players);
					return (
						<div>
							<Button
								value={`/msgroom ${room.id},/botmsg ${room.parent.status.userid},${prefix}@${room.id} ${meta.id} unstash ${game.id}`}
							>
								{$T('GAME.LABELS.UNSTASH')}
							</Button>
							<span style={{ marginLeft: 10, marginRight: 20 }}>{game.id}</span>
							{players.length > 0 ? players.map(player => <Username name={player.name} />).space(', ') : '-'}
						</div>
					);
				})
			) : (
				<h3>{$T('GAME.NO_BACKUPS_FOUND')}</h3>
			)}
			<hr />
		</>
	);
}
