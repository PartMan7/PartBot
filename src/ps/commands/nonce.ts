import { PSNonces } from '@/cache';
import { ChatError } from '@/utils/chatError';
import { randomString } from '@/utils/random';

import type { TranslatedText } from '@/i18n/types';
import type { PSCommand } from '@/types/chat';
import type { Perms } from '@/types/perms';

export function createNonce(callback: () => TranslatedText | void, perms: Perms): string {
	const nonceKey = randomString();
	PSNonces[nonceKey] = { callback };
	if (perms) PSNonces[nonceKey].perms = perms;
	return nonceKey;
}

export const command: PSCommand = {
	name: 'nonce',
	help: 'Fires a nonce event. Internal command.',
	syntax: 'CMD',
	categories: ['utility'],
	flags: { noDisplay: true, allowPMs: true },
	async run({ arg, message, checkPermissions, $T }) {
		const nonce = arg.trim();
		if (nonce === 'constructor') throw new ChatError($T('SCREW_YOU'));
		if (!(nonce in PSNonces)) throw new ChatError($T('COMMANDS.NONCE.UNAVAILABLE'));

		const event = PSNonces[nonce]!;
		if (!checkPermissions(event.perms ?? 'regular')) throw new ChatError($T('ACCESS_DENIED'));

		delete PSNonces[nonce];
		try {
			const res = event.callback();
			message.privateReply(res ?? $T('COMMANDS.NONCE.DONE'));
		} catch (err) {
			PSNonces[nonce] = event;
			throw err;
		}
	},
};
