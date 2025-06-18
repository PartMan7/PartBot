import { PSGames } from '@/cache';
import { Games } from '@/ps/games';
import { renderMenu } from '@/ps/games/menus';

import type { PSCommand } from '@/types/chat';
import type { HTMLopts } from 'ps-client/classes/common';
import type { ReactElement } from 'react';

export const command: PSCommand = {
	name: 'games',
	help: 'Metacommands for games.',
	syntax: 'CMD [menu]',
	perms: Symbol.for('games.manage'),
	categories: ['game'],
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
							.filter(Game => Object.values(PSGames[Game.meta.id] ?? {}).filter(game => game.room.id === message.target.id).length > 0)
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
	},
};
