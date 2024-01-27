function Test ({ children }) {
	return <div>
		<h3>Header</h3>
		<span>
			{'<b>This should not be bold</b>'}
			<br/>
			{children}
		</span>
	</div>;
}

export const command: PSCommand = {
	name: 'quotes',
	aliases: ['q', 'quote'],
	help: 'Quotes!',
	syntax: 'CMD',
	async run (message) {
		message.sendHTML(<Test>This is in JSX</Test>);
	}
};
