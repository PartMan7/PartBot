import { getAlts } from '@/database/alts';

export const command: PSCommand = {
	name: 'alts',
	help: 'Testing command',
	syntax: 'CMD USERNAME?',
	aliases: ['getalts'],
	async run({ message }) {
		const altsList = await getAlts(message.author.userid);
		message.reply(`Alts: ${altsList.join(', ')}`);
	},
};
