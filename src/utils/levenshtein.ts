export function levenshtein(a: string, b: string): number {
	const d = Array.from({ length: a.length + 1 }, (): number[] => Array(b.length + 1).fill(0));
	for (let i = 0; i < a.length + 1; i++) d[i][0] = i;
	for (let j = 0; j < b.length + 1; j++) d[0][j] = j;
	for (let i = 0; i < a.length; i++) {
		for (let j = 0; j < b.length; j++) {
			let cost;
			if (a[i] === b[j]) cost = 0;
			else cost = 1;
			d[i + 1][j + 1] = Math.min(d[i][j + 1] + 1, d[i + 1][j] + 1, d[i][j] + cost);
			if (i > 1 && j > 1 && a[i] === b[j - 1] && a[i - 1] === b[j]) {
				d[i + 1][j + 1] = Math.min(d[i + 1][j + 1], d[i - 1][j - 1] + 1);
			}
		}
	}
	return d[a.length][b.length];
}
