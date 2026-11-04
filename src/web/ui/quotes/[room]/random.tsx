import type { UIRouteHandler } from '@/types/web';

export const handler: UIRouteHandler = (_req, res) => {
	res.getBundle('quotes', 'Random Quote');
};
