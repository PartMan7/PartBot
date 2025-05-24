import { sleep } from '@/utils/sleep';

import type { NoTranslate } from '@/i18n/types';
import type { PSCommand } from '@/types/chat';

export const command: PSCommand = {
	name: 'kill',
	help: 'Kills the bot.',
	syntax: 'CMD',
	perms: 'admin',
	async run({ message }) {
		await Promise.any([message.reply(';-;' as NoTranslate), sleep('2s')]);
		process.exit();
	},
};
