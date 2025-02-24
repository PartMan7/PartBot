import type { CellRenderer } from '@/ps/games/render';
import type { ReactElement } from 'react';

type Label = 'A-Z' | 'Z-A' | '1-9' | '9-1';

const aCode = 'A'.charCodeAt(0);

function getLabels(amount: number, label: Label): string[] {
	const base = Array.from({ length: amount }).map((_, index) => index + 1);
	if (label === '9-1' || label === 'Z-A') base.reverse();
	if (label === 'A-Z' || label === 'Z-A') return base.map(num => String.fromCharCode(aCode + num - 1));
	else return base.map(num => num.toString());
}

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
		<table className="border-collapse m-5">
			<tbody>
				<tr>
					<th />
					{colLabels.map(label => (
						<th className="text-secondary h-5">{label}</th>
					))}
					<th />
				</tr>

				{board.map((row, i) => (
					<tr>
						<th className="text-secondary w-5">{rowLabels[i]}</th>
						{row.map((cell, j) => (
							<Cell cell={cell} i={i} j={j} />
						))}
						<th className="text-secondary w-5">{rowLabels[i]}</th>
					</tr>
				))}

				<tr>
					<th />
					{colLabels.map(label => (
						<th className="text-secondary h-5">{label}</th>
					))}
					<th />
				</tr>
			</tbody>
		</table>
	);
}
