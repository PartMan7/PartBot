import { checkPermissions } from '@/ps/handlers/permissions';
import { ACCESS_DENIED } from '@/text';

export const command: PSCommand = {
	name: 'echo',
	help: 'Echoes the given text',
	syntax: 'CMD (text)',
	aliases: ['do'],
	perms: ['room', 'voice'],
	async run({ message, originalCommand: [originalCommand], arg }) {
		if (originalCommand === 'do') {
			if (checkPermissions('admin', message)) message.reply(arg);
			else throw new ChatError(ACCESS_DENIED);
		} else message.reply(`[[ ]]${arg}`);
	},
};
