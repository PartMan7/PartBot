import { addJoinphrase, deleteJoinphrase, getJoinphrase } from '@/database/joinphrases';
import { ChatError } from '@/utils/chatError';

import type { NoTranslate, ToTranslate } from '@/i18n/types';
import type { PSCommand } from '@/types/chat';

export const command: PSCommand = {
	name: 'jp',
	help: 'Joinphrases module!',
	perms: ['room', 'driver'],
	syntax: 'CMD',
	aliases: ['joinphrase'],
	categories: ['utility'],
	extendedAliases: {
		addjp: ['jp', 'new'],
		deletejp: ['jp', 'delete'],
		removejp: ['jp', 'delete'],
		remjp: ['jp', 'delete'],
		getjp: ['jp', 'get'],
		showjp: ['jp', 'get'],
		displayjp: ['jp', 'get'],
	},
	children: {
		new: {
			name: 'new',
			help: 'Adds a new  joinphrase for a given user',
			perms: ['room', 'driver'],
			flags: { allowPMs: false },
			syntax: 'CMD [User], [Joinphrase]',
			aliases: ['add', 'a', 'n'],
			async run({ message, arg, $T, checkPermissions }) {
				if (!checkPermissions(['room', 'driver'])) {
					throw new ChatError($T('ACCESS_DENIED'));
				}
				if (!arg) {
					message.reply($T('INVALID_ARGUMENTS'));
				}
				const args: string[] = arg.split(',').map(s => s.trim());
				const username = args[0];
				const phrase = args[1];
				if (!phrase) {
					message.reply('Put both username and message smh. Try again.' as ToTranslate);
					return;
				}

				try {
					await addJoinphrase(username, message.target.id, phrase, message.author.name);
					message.reply('Joinphrase Added!' as ToTranslate);
				} catch (e: unknown) {
					message.reply(`${username} already has a joinphrase in ${message.target.title}...` as ToTranslate);
				}
			},
		},
		delete: {
			name: 'delete',
			help: "Deletes a user's joinphrase",
			perms: ['room', 'driver'],
			syntax: 'CMD [User]',
			aliases: ['del', 'remove', 'rem', 'd', 'r'],
			async run({ message, arg, $T, checkPermissions }) {
				if (!checkPermissions(['room', 'driver'])) {
					throw new ChatError($T('ACCESS_DENIED'));
				}
				if (!arg) {
					message.reply($T('INVALID_ARGUMENTS'));
					return;
				}
				arg.trim();

				if ((await deleteJoinphrase(arg, message.target.id)) === null) {
					message.reply(`${arg} has no joinphrase in this room!` as ToTranslate);
				} else {
					message.reply('Joinphrase deleted.' as ToTranslate);
				}
			},
		},
		get: {
			name: 'get',
			help: 'Displays a given joinphrase',
			perms: ['room', 'driver'],
			syntax: 'CMD [User]',
			aliases: ['show', 'display'],
			async run({ message, arg, $T, checkPermissions }) {
				if (!checkPermissions(['room', 'driver'])) {
					throw new ChatError($T('ACCESS_DENIED'));
				}
				if (!arg) {
					message.reply($T('INVALID_ARGUMENTS'));
					return;
				}
				arg.trim();

				const phraseObject = await getJoinphrase(arg, message.target.id);
				const phrase = phraseObject?.phrase;

				message.privateReply(`${phrase}` as NoTranslate);
			},
		},
	},
	async run({ arg, run }) {
		return await run(`jp get ${arg}`);
	},
};
