import { renderToStaticMarkup } from 'react-dom/server';

export function jsxToHTML (jsx: React.ReactElement): string {
	const domRendered = renderToStaticMarkup(jsx);
	// TODO Add HTML minification
	return domRendered;
}
