import { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export function jsxToHTML(jsx: ReactElement): string {
	const domRendered = renderToStaticMarkup(jsx);
	// TODO Add HTML minification
	return domRendered;
}
