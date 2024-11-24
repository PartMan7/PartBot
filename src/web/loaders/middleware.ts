import { renderToString } from 'react-dom/server';
import type { Request, Response, NextFunction } from 'express';
import { jsxToHTML } from '@/utils/jsxToHTML';
import { renderTemplate } from '@/web/loaders/util';

import type { Render } from '@/types/web';

export function renderReact(req: Request, res: Response, next: NextFunction): void {
	const render: Render = async (jsx, title, hydrate) => {
		if (!hydrate) {
			const content = jsxToHTML(jsx);
			const page = await renderTemplate('static-react.html', { title, content });
			return res.send(page);
		}
		// TODO: Hydrate interactive content
		const preHydrated = renderToString(jsx);
		const page = await renderTemplate('react.html', { title, preHydrated, content: '???' });
		return res.send(page);
	};
	Object.assign(res, { render });
	next();
}
