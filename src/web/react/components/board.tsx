import type { CellRenderer } from '@/ps/games/render';
import type { CSSProperties, ReactElement } from 'react';

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
	style = {},
	labels,
	Cell,
}: {
	board: T[][];
	style?: CSSProperties;
	labels: { row: Label; col: Label } | null;
	Cell: CellRenderer<T>;
}): ReactElement {
	const rowLabels = labels ? getLabels(board.length, labels.row) : [];
	const colLabels = labels ? getLabels(board[0].length, labels.col) : [];
	return (
		<table className="border-collapse m-5" style={style}>
			<tbody>
				{labels ? (
					<tr>
						<th />
						{colLabels.map(label => (
							<th className="text-secondary h-5">{label}</th>
						))}
						<th />
					</tr>
				) : null}

				{board.map((row, i) => (
					<tr>
						{labels ? <th className="text-secondary w-5">{rowLabels[i]}</th> : null}
						{row.map((cell, j) => (
							<Cell cell={cell} i={i} j={j} />
						))}
						{labels ? <th className="text-secondary w-5">{rowLabels[i]}</th> : null}
					</tr>
				))}

				{labels ? (
					<tr>
						<th />
						{colLabels.map(label => (
							<th className="text-secondary h-5">{label}</th>
						))}
						<th />
					</tr>
				) : null}
			</tbody>
		</table>
	);
}
