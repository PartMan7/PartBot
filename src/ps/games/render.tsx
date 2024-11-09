import type { ReactElement, ReactNode } from 'react';

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
	rowLabel,
	colLabel,
	Cell,
}: {
	board: T[][];
	rowLabel: Label;
	colLabel: Label;
	Cell: CellRenderer<T>;
}): ReactElement {
	const rowLabels = getLabels(board.length, rowLabel);
	const colLabels = getLabels(board[0].length, colLabel);
	return (
		<table
			style={{
				borderCollapse: 'collapse',
				margin: '20px',
			}}
		>
			<tbody>
				<tr>
					<th />
					{colLabels.map(label => (
						<th style={{ color: 'gray', height: 20 }}>{label}</th>
					))}
					<th />
				</tr>

				{board.map((row, i) => (
					<tr>
						<th style={{ color: 'gray', width: 20 }}>{rowLabels[i]}</th>
						{row.map((cell, j) => (
							<Cell cell={cell} i={i} j={j} />
						))}
						<th style={{ color: 'gray', width: 20 }}>{rowLabels[i]}</th>
					</tr>
				))}

				<tr>
					<th />
					{colLabels.map(label => (
						<th style={{ color: 'gray', height: 20 }}>{label}</th>
					))}
					<th />
				</tr>
			</tbody>
		</table>
	);
}
