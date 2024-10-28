export const command: PSCommand = {
	name: 'boop',
	help: 'Boops',
	syntax: 'CMD',
	perms: ['room', 'mod'],
	async run({ message }) {
		return message.reply('BOOP');
	},
};
