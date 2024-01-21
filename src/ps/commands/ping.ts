export const command: PSCommand = {
	name: 'ping',
	help: 'You\'re asking help on... how to use ping?',
	syntax: 'CMD',
	perms: ['room', 'voice'],
	aliases: ['echo'],
	async run (message, { originalCommand, args }) {
		if (originalCommand[0] === 'echo') {
			if (args.length) return message.reply(` [[]]${args.join(' ')}`);
			else return message.reply('ECHO!');
		}
		return message.reply('Pong!');
	}
};
