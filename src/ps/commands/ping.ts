export const command: PSCommand = {
	name: 'ping',
	help: 'You\'re asking help on... how to use ping?',
	syntax: 'CMD',
	perms: ['room', 'voice'],
	aliases: ['echo'],
	async run (message, { originalCommand, arg }) {
		if (originalCommand[0] === 'echo') {
			if (arg) return message.reply(` [[]]${arg}`);
			else return message.reply('ECHO!');
		}
		return message.reply('Pong!');
	}
};
