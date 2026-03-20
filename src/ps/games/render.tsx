import { Button } from '@/utils/components/ps';

import type { BaseGame, CommonGame } from '@/ps/games/game';
import type { BaseState } from '@/ps/games/types';
import type { CSSProperties, HTMLProps, ReactElement, ReactNode } from 'react';

export function Small({ children }: { children: ReactNode }): ReactElement {
	return <div style={{ zoom: '60%' }}>{children}</div>;
}

export function GameHeader({
	header,
	dimHeader,
}: {
	header: string | undefined;
	dimHeader: boolean | undefined;
}): ReactElement | null {
	if (!header) return null;
	return <h1 style={dimHeader ? { color: 'gray' } : {}}>{header}</h1>;
}

export function LogEntry({
	game: {
		id,
		msg,
		meta: { name: game },
		$T,
	},
	children,
}: {
	game: CommonGame;
	children: ReactNode;
}): ReactElement {
	return (
		<>
			<hr />
			<div style={{ display: 'inline-block' }}>
				<small>{game + id}</small>
				<br />
				{children}
			</div>
			<Button name="send" value={`${msg} watch`} style={{ float: 'right' }}>
				{$T('GAME.LABELS.WATCH')}
			</Button>
			<hr />
		</>
	);
}

export function renderSignups<State extends BaseState>(this: BaseGame<State>, staff: boolean): ReactElement | null {
	const startable = this.meta.autostart === false && this.startable();
	if (staff && !startable) return null;
	return (
		<>
			<hr />
			<h1>{this.$T('GAME.SIGNUPS_OPEN', { game: this.meta.name })}</h1>
			{this.sides
				? Object.entries(this.meta.turns!)
						.filter(([turn]) => !this.players[turn])
						.map(([side, sideName]) => (
							<Button key={side} value={`${this.msg} join ${side}`} style={{ margin: 5 }}>
								{sideName}
							</Button>
						))
				: null}
			{this.sides && this.turns.length - Object.keys(this.players).length > 1 ? (
				<Button value={`${this.msg} join -`} style={{ margin: 5 }}>
					{this.$T('GAME.LABELS.RANDOM')}
				</Button>
			) : null}
			{!this.sides ? <Button value={`${this.msg} join`}>{this.$T('GAME.LABELS.JOIN')}</Button> : null}
			{staff && startable ? (
				<Button value={`${this.msg} start`} style={{ marginLeft: 8 }}>
					{this.$T('GAME.LABELS.START')}
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
			<h1>{this.$T('GAME.SIGNUPS_CLOSED', { game: this.meta.name })}</h1>
			<Button value={`${this.msg} watch`}>{this.$T('GAME.LABELS.WATCH')}</Button>
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
	children,
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
			{children}
		</table>
	);
}

function Pip({ style }: { style?: CSSProperties }): ReactElement {
	return <div style={{ background: 'black', borderRadius: 99, width: 10, height: 10, position: 'absolute', ...style }} />;
}

export function Dice({ value, style }: { value: number; style?: CSSProperties }): ReactElement | null {
	if (!value || value > 6) return null;
	return (
		<center style={{ position: 'relative', background: 'white', height: 42, width: 42, borderRadius: 4, ...style }}>
			{value === 1 ? <Pip style={{ top: 16, left: 16 }} /> : null}
			{value === 2 ? (
				<>
					<Pip style={{ top: 16, left: 7 }} />
					<Pip style={{ top: 16, right: 7 }} />
				</>
			) : null}
			{value === 3 ? (
				<>
					<Pip style={{ top: 5, right: 5 }} />
					<Pip style={{ top: 16, left: 16 }} />
					<Pip style={{ bottom: 5, left: 5 }} />
				</>
			) : null}
			{value === 4 ? (
				<>
					<Pip style={{ top: 7, left: 7 }} />
					<Pip style={{ top: 7, right: 7 }} />
					<Pip style={{ bottom: 7, left: 7 }} />
					<Pip style={{ bottom: 7, right: 7 }} />
				</>
			) : null}
			{value === 5 ? (
				<>
					<Pip style={{ top: 5, left: 5 }} />
					<Pip style={{ top: 5, right: 5 }} />
					<Pip style={{ top: 16, left: 16 }} />
					<Pip style={{ bottom: 5, left: 5 }} />
					<Pip style={{ bottom: 5, right: 5 }} />
				</>
			) : null}
			{value === 6 ? (
				<>
					<Pip style={{ top: 4, left: 8 }} />
					<Pip style={{ top: 4, right: 8 }} />
					<Pip style={{ top: 16, left: 8 }} />
					<Pip style={{ top: 16, right: 8 }} />
					<Pip style={{ bottom: 4, left: 8 }} />
					<Pip style={{ bottom: 4, right: 8 }} />
				</>
			) : null}
		</center>
	);
}
