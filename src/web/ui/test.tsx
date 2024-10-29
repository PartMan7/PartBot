const Div = () => <div>Test content here; fully static</div>;

export const handler: RouteHandler = (req, res) => {
	return res.render(<Div />, 'Test Title', false);
};
