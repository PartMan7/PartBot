import { type CellRenderer, Table } from '@/ps/games/render';
import { Button } from '@/utils/components/ps';

import type { LightsOut } from '@/ps/games/lightsout/index';
import type { State } from '@/ps/games/lightsout/types';
import type { ReactElement } from 'react';

export function renderCloseSignups(this: LightsOut): ReactElement {
	const player = Object.values(this.players)[0].name;
	return (
		<>
			<hr />
			{player} is playing a round of {this.meta.name}!
			<Button value={`${this.renderCtx.simpleMsg} watch`} style={{ marginLeft: 16 }}>
				{this.$T('GAME.LABELS.WATCH')}
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

	return (
		<div
			style={{
				height: size,
				width: size,
				backgroundImage: `radial-gradient(${on ? LIGHTS.ON : LIGHTS.OFF} 60%,#333333)`,
				borderRadius: radius,
				margin,
			}}
		/>
	);
}

type This = { msg: string; simpleMsg: string };

export function render(
	this: This,
	data: State,
	{ size, player, ended }: { size: [number, number]; ended: boolean; player: boolean }
): ReactElement {
	const Cell: CellRenderer<boolean> = ({ cell, i, j }) => (
		<td>
			{player && !ended ? (
				<Button name="send" value={`${this.simpleMsg} play ${i} ${j}`} style={{ background: 'none', border: 'none', padding: 0 }}>
					<Bulb on={cell} small={ended && !player} />
				</Button>
			) : (
				<Bulb on={cell} small={ended && !player} />
			)}
		</td>
	);

	const board = ended && !player ? data.original : data.board;

	return (
		<center style={ended && !player ? { maxHeight: 200, overflowY: 'scroll' } : {}}>
			<Table board={board} labels={null} Cell={Cell} style={{ border: 'none', background: '#111' }} />
			{ended && player ? (
				<Button name="send" value={`${this.simpleMsg} create ${size.join(' ')}`}>
					Play Again
				</Button>
			) : null}
		</center>
	);
}
