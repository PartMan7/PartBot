import { renderToStaticMarkup } from 'react-dom/server';

import { getRenderGame } from '@/ps/games/game';

import type { ReactElement } from 'react';

export function jsxToHTML(jsx: ReactElement): string {
	const game = getRenderGame(jsx);
	const domRendered = (game ? game.runRender(() => renderToStaticMarkup(jsx)) : renderToStaticMarkup(jsx)).replace(/\n/g, '');
	// TODO Add HTML minification
	return domRendered;
}
