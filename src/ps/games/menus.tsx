import { PSGames } from '@/cache';
import { gameCache } from '@/cache/games';
import { prefix } from '@/config/ps';
import { Button, Username } from '@/utils/components/ps';
import { log } from '@/utils/logger';

import type { Meta, Player } from '@/ps/games/common';
import type { Room } from 'ps-client';
import type { ReactElement } from 'react';

export function renderMenu(room: Room, meta: Meta, isStaff: boolean): ReactElement {
	const games = Object.values(PSGames[meta.id] ?? {}).filter(game => game.roomid === room.id);
	if (!games?.length) return <div>No games found.</div>;
	return (
		<>
			{games.map(game => {
				const cmd = game.renderCtx.msg;
				return (
					<div key={game.id}>
						{game.started ? (
							<>
								{Object.values(game.players)
									.map(player => <Username name={player.name} />)
									.space('/')}
								<Button value={`${cmd} watch`} style={{ marginLeft: 10 }}>
									Watch
								</Button>
							</>
						) : game.sides ? (
							game.turns
								.map(turn =>
									game.players[turn] ? (
										<Username name={game.players[turn].name} />
									) : (
										<Button value={`${cmd} join ${turn}`}>Join ({turn})</Button>
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
										Join
									</Button>
								) : null}
							</>
						)}
						{isStaff ? (
							<>
								<Button value={`${cmd} end ${game.id}`} style={{ marginLeft: 20 }}>
									End
								</Button>
								<Button value={`${cmd} stash ${game.id}`} style={{ marginLeft: 20 }}>
									Stash
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

export function renderBackups(room: Room, meta: Meta): ReactElement {
	const stashedGames = gameCache.getByGame(room.roomid, meta.id).filter(game => !PSGames[meta.id]?.[game.id]);
	return (
		<>
			<hr />
			{stashedGames.length > 0 ? (
				stashedGames.map(game => {
					let parsed: { players: Record<string, Player> };
					try {
						parsed = JSON.parse(game.backup);
					} catch (e) {
						log(`Unable to parse ${game.backup} in backups`, e);
						return <div>Unable to parse backup for {game.id}</div>;
					}
					const players = Object.values(parsed.players);
					return (
						<div>
							<Button
								value={`/msgroom ${room.id},/botmsg ${room.parent.status.userid},${prefix}@${room.id} ${meta.id} unstash ${game.id}`}
							>
								Unstash
							</Button>
							<span style={{ marginLeft: 10, marginRight: 20 }}>{game.id}</span>
							{players.length > 0 ? players.map(player => <Username name={player.name} />).space(', ') : '-'}
						</div>
					);
				})
			) : (
				<h3>No game backups found.</h3>
			)}
			<hr />
		</>
	);
}
