import { Button } from '@/utils/components/ps';

import type { BaseState } from '@/ps/games/common';
import type { BaseGame } from '@/ps/games/game';
import type { CSSProperties, HTMLProps, ReactElement, ReactNode } from 'react';

export function renderSignups<State extends BaseState>(this: BaseGame<State>, staff: boolean): ReactElement | null {
	const startable = this.meta.autostart === false && this.startable();
	if (staff && !startable) return null;
	return (
		<>
			<hr />
			<h1>{this.meta.name} Signups have begun!</h1>
			{this.sides
				? Object.entries(this.meta.turns!)
						.filter(([turn]) => !this.players[turn])
						.map(([side, sideName]) => (
							<Button key={side} value={`${this.renderCtx.msg} join ${side}`} style={{ margin: 5 }}>
								{sideName}
							</Button>
						))
				: null}
			{this.sides && this.turns.length - Object.keys(this.players).length > 1 ? (
				<Button value={`${this.renderCtx.msg} join -`} style={{ margin: 5 }}>
					Random
				</Button>
			) : null}
			{!this.sides ? <Button value={`${this.renderCtx.msg} join`}>Join</Button> : null}
			{staff && startable ? (
				<Button value={`${this.renderCtx.msg} start`} style={{ marginLeft: 8 }}>
					Start
				</Button>
			) : null}
			<hr />
		</>
	);
}

export function renderCloseSignups<State extends BaseState>(this: BaseGame<State>): ReactElement {
	return (
		<>
			<hr />
			<h1>{this.meta.name} Signups have closed.</h1>
			<Button value={`${this.renderCtx.msg} watch`}>Watch</Button>
			<hr />
		</>
	);
}

type Label = 'A-Z' | 'Z-A' | '1-9' | '9-1';

function getLabels(amount: number, label: Label): string[] {
	const base = Array.from({ length: amount }).map((_, index) => index + 1);
	if (label === '9-1' || label === 'Z-A') base.reverse();
	if (label === 'A-Z' || label === 'Z-A') return base.map(num => num.toLetter());
	else return base.map(num => num.toString());
}

export type CellRenderer<T> = (props: { cell: T; i: number; j: number }) => ReactNode;

export function Table<T>({
	board,
	style = {},
	labels,
	Cell,
	children: _children,
	...props
}: {
	board: T[][];
	style?: CSSProperties;
	labels: { row: Label; col: Label } | null;
	Cell: CellRenderer<T>;
} & HTMLProps<HTMLTableElement>): ReactElement {
	const rowLabels = labels ? getLabels(board.length, labels.row) : [];
	const colLabels = labels ? getLabels(board[0].length, labels.col) : [];
	return (
		<table
			style={{
				borderCollapse: 'collapse',
				margin: 20,
				...style,
			}}
			{...props}
		>
			<tbody>
				{labels ? (
					<tr>
						<th />
						{colLabels.map(label => (
							<th style={{ color: 'gray', height: 20 }}>{label}</th>
						))}
						<th />
					</tr>
				) : null}

				{board.map((row, i) => (
					<tr>
						{labels ? <th style={{ color: 'gray', width: 20 }}>{rowLabels[i]}</th> : null}
						{row.map((cell, j) => (
							<Cell cell={cell} i={i} j={j} />
						))}
						{labels ? <th style={{ color: 'gray', width: 20 }}>{rowLabels[i]}</th> : null}
					</tr>
				))}

				{labels ? (
					<tr>
						<th />
						{colLabels.map(label => (
							<th style={{ color: 'gray', height: 20 }}>{label}</th>
						))}
						<th />
					</tr>
				) : null}
			</tbody>
		</table>
	);
}
