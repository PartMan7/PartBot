import { getAlts } from '@/database/alts';
import { checkPermissions } from '@/ps/handlers/permissions';
import { ACCESS_DENIED } from '@/text';

export const command: PSCommand = {
	name: 'alts',
	help: 'Testing command',
	syntax: 'CMD USERNAME?',
	aliases: ['getalts'],
	async run({ message, arg }) {
		let lookup = message.author.userid;
		if (arg) {
			if (!checkPermissions(['room', 'driver'], message)) throw new ChatError(ACCESS_DENIED);
			lookup = Tools.toId(arg);
		}
		const altsList = await getAlts(lookup);
		message.reply(`Alts: ${altsList.join(', ')}`);
	},
};
