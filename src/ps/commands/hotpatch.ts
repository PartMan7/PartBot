import Sentinel from '@/sentinel';

import type { NoTranslate } from '@/i18n/types';
import type { PSCommand } from '@/types/chat';

export const command: PSCommand = {
	name: 'hotpatch',
	help: 'Hotpatches stuff.',
	syntax: 'CMD [hotpatch type]',
	flags: { allowPMs: true },
	perms: 'admin',
	categories: ['utility'],
	async run({ message, arg }) {
		const types = arg.split(/\s*,\s*/).map(type => type.toLowerCase().replaceAll(' ', '-'));
		const result = await Promise.allSettled(
			types.map(async type => {
				try {
					await Sentinel.hotpatch(type, message.author.name);
					return type;
				} catch (err) {
					if (err instanceof Error) {
						err.message = `${type}: ${err.message}`;
						throw err;
					}
					return err as string;
				}
			})
		);

		const success = result.filterMap(res => (res.status === 'fulfilled' ? res.value : undefined));
		const failed = result.filterMap<Error>(res => (res.status === 'rejected' ? res.reason : undefined));

		if (success.length > 0) message.reply(`Hotpatched ${success.list()}.` as NoTranslate);
		if (failed.length > 0) {
			failed.forEach(failure => message.reply(`Failed to hotpatch ${failure.message}` as NoTranslate));
		}
	},
};
