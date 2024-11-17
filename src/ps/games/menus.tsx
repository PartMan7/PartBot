import { PSGames } from '@/cache';
import { Button, Username } from '@/utils/components/ps';

import type { Room } from 'ps-client';
import type { ReactElement } from 'react';
import type { Meta } from '@/ps/games/common';

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
							<Button value={`${cmd} end`} style={{ marginLeft: 20 }}>
								End
							</Button>
						) : null}
						<span style={{ color: 'gray', marginLeft: 20 }}>{game.id}</span>
					</div>
				);
			})}
		</>
	);
}
