import { alt, getAlts } from 'database/alts';

export default {
	name: 'alt',
	help: 'Testing command',
	aliases: ['getalts'],
	async run (message, { originalCommand, args }) {
		if (originalCommand[0] === 'getalts') {
			const altsList = await getAlts(message.author.userid);
			return message.reply(`Alts: ${altsList.join(', ')}`);
		}
		const [from, to] = args;
		await alt(from, to).then(log);
		message.reply(`Alt added`);
	}
} as PSCommand;
