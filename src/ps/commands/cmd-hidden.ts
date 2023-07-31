export default {
	name: 'cmd',
	help: 'Testing command',
	async run (message) {
		message.reply(`Super secret stuff!`);
	}
} as PSCommand;
