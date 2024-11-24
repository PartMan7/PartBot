import type { UIRouteHandler } from '@/types/web';

const Div = () => <div>Test content here; fully static</div>;

export const handler: UIRouteHandler = (req, res) => {
	res.render(<Div />, 'Test Title', false);
};
