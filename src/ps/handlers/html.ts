import { isValidElement } from 'react';

import { jsxToHTML } from '@/utils/jsxToHTML';
import { Logger } from '@/utils/logger';

import type { ReactElement } from 'react';

export function transformHTML(input: string | ReactElement): string {
	if (typeof input === 'string') return input;
	if (isValidElement(input)) return jsxToHTML(input);
	Logger.log('Received invalid HTML arg', input);
	Logger.errorLog(new Error(`Invalid HTML! ${input}`));
	return input?.toString() ?? '';
}
