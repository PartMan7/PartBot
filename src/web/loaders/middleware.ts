import { renderToString } from 'react-dom/server';

import { jsxToHTML } from '@/utils/jsxToHTML';
import { renderTemplate } from '@/web/loaders/util';

import type { GetBundle, Render } from '@/types/web';
import type { NextFunction, Request, Response } from 'express';

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

	const getBundle: GetBundle = async (bundle, title) => {
		const template = await renderTemplate('react-bundled.html', { title, bundle });
		return res.send(template);
	};

	Object.assign(res, { render, getBundle });
	next();
}
