/**
 * Sorts the given data in descending order of rankBy, maps it to columns, and inserts (possibly tied) header entries.
 */
export function rankedSort<Data, List extends (string | number)[]>(
	data: Data[],
	rankBy: (entry: Data) => number | number[],
	dataToCols: (entry: Data) => List,
	serialize: (entry: Data) => string = entry =>
		dataToCols(entry)
			.filter(val => typeof val === 'number')
			.join(',')
): [number, ...List][] {
	const sorted = data
		.slice()
		.sortBy(rankBy, 'desc')
		.map(entry => {
			return { list: dataToCols(entry), serial: serialize(entry) };
		});

	return sorted.map(({ list, serial: currentKey }, index) => {
		let rank = index;
		while (rank > 0) {
			const prev = sorted[rank - 1]!;
			if (prev.serial !== currentKey) break;
			rank--;
		}

		return [rank + 1, ...list];
	});
}
