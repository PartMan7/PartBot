import { isValidElement } from 'react';

import { jsxToHTML } from '@/utils/jsxToHTML';

import type { ReactElement} from 'react';

export function transformHTML(input: string | ReactElement): string {
	if (typeof input === 'string') return input;
	if (isValidElement(input)) return jsxToHTML(input);
	log('Received invalid HTML arg', input);
	return input?.toString() ?? '';
}
