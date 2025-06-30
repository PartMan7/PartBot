import { escapeRegEx } from '@/utils/regexEscape';

import type { ReactNode } from 'react';

const REPLACER_KEY = '%%%__REPLACE__%%%';

export function groupSub(input: string, sub: Record<string, ReactNode>): (string | ReactNode)[] {
	const insert: ReactNode[] = [];
	const matchPattern = new RegExp(
		Object.keys(sub)
			.map(key => escapeRegEx(key))
			.join('|'),
		'g'
	);
	const toSub = input.replace(matchPattern, match => {
		insert.push(sub[match]);
		return REPLACER_KEY;
	});

	return toSub.split(new RegExp(`(${REPLACER_KEY})`)).flatMap(term => (term === REPLACER_KEY ? insert.shift() : term));
}
