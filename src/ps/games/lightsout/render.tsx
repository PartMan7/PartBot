import { getGame, getSimpleMsg } from '@/ps/games/game';
import { type CellRenderer, Table } from '@/ps/games/render';
import { isAprilFoolsActive } from '@/ps/specialEvents';
import { Button } from '@/utils/components/ps';
import { pluralize } from '@/utils/pluralize';

import type { LightsOut } from '@/ps/games/lightsout/index';
import type { State } from '@/ps/games/lightsout/types';
import type { ReactElement } from 'react';

export function renderCloseSignups(): ReactElement {
	const game = getGame<LightsOut>();
	const player = Object.values(game.players)[0].name;
	return (
		<>
			<hr />
			{player} is playing a round of {game.meta.name}!
			<Button value={`${getSimpleMsg()} watch`} style={{ marginLeft: 16 }}>
				{game.$T('GAME.LABELS.WATCH')}
			</Button>
			<hr />
		</>
	);
}

const LIGHTS = {
	ON: '#fff9ba',
	OFF: '#6e6d62',
};

function Bulb({ on, small }: { on: boolean; small: boolean }): ReactElement {
	const size = small ? 15 : 35;
	const radius = small ? 3.75 : 10;
	const margin = small ? 1.5 : 3;

	const showOn = isAprilFoolsActive() ? !on : on;

	return (
		<div
			style={{
				height: size,
				width: size,
				backgroundImage: `radial-gradient(${showOn ? LIGHTS.ON : LIGHTS.OFF} 60%,#333333)`,
				borderRadius: radius,
				margin,
			}}
		/>
	);
}

export function render(
	data: State,
	{ size, player, ended, genClicks }: { size: [number, number]; ended: boolean; player: boolean; genClicks: number }
): ReactElement {
	const simpleMsg = getSimpleMsg();

	const Cell: CellRenderer<boolean> = ({ cell, i, j }) => (
		<td>
			{player && !ended ? (
				<Button name="send" value={`${simpleMsg} play ${i} ${j}`} style={{ background: 'none', border: 'none', padding: 0 }}>
					<Bulb on={cell} small={ended && !player} />
				</Button>
			) : (
				<Bulb on={cell} small={ended && !player} />
			)}
		</td>
	);

	const board = ended && !player ? data.original : data.board;

	return (
		<>
			<small style={{ float: 'right', padding: '4px 12px' }}>
				My solution: <b>{pluralize(genClicks, { singular: 'move', plural: 'moves' })}</b>
			</small>
			<br />
			<center style={ended && !player ? { maxHeight: 200, overflowY: 'scroll' } : {}}>
				<Table board={board} labels={null} Cell={Cell} style={{ border: 'none', background: '#111' }} />
				{ended && player ? (
					<Button name="send" value={`${simpleMsg} create ${size.join(' ')}`}>
						Play Again
					</Button>
				) : null}
			</center>
		</>
	);
}
