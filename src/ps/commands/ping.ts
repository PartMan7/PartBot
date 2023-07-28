export default {
	name: 'ping',
	help: 'You\'re asking help on... how to use ping?',
	aliases: ['echo'],
	async run (message, { originalCommand, args }) {
		if (originalCommand[0] === 'echo') {
			if (args.length) return message.reply(` [[]]${args.join(' ')}`);
			else return message.reply('ECHO!');
		}
		return message.reply('Pong!');
	}
} as PSCommand;
