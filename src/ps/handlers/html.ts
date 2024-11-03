import { isValidElement, ReactElement } from 'react';
import { jsxToHTML } from '@/utils/jsx-to-html';

export function transformHTML(input: string | ReactElement): string {
	if (typeof input === 'string') return input;
	if (isValidElement(input)) return jsxToHTML(input);
	log('Received invalid HTML arg', input);
	return input?.toString() ?? '';
}
