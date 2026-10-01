import { renderToStaticMarkup } from 'react-dom/server';

import type { ReactElement } from 'react';

export function jsxToHTML(jsx: ReactElement): string {
	const domRendered = renderToStaticMarkup(jsx).replace(/\n/g, '');
	// TODO Add HTML minification
	return domRendered;
}
