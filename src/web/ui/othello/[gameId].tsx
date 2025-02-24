import type { UIRouteHandler } from '@/types/web';

export const handler: UIRouteHandler = (req, res) => {
	res.getBundle('othello', 'Othello Replay');
};
