function Unsafe ({ children }) {
	return <div>{children}</div>;
}

export const command: PSCommand = {
	name: 'quotes',
	aliases: ['q'],
	help: 'Quotes!',
	syntax: 'CMD',
	async run (message) {
		message.reply('Test');
		// console.log(<Unsafe>Test</Unsafe>);
	}
};
