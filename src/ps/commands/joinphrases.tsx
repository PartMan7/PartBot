import { toRoomID } from 'ps-client/tools';

import { deleteJoinphrase, fetchAllJoinphrases, getJoinphrase, setJoinphrase } from '@/database/joinphrases';
import { MAX_MESSAGE_LENGTH } from '@/ps/constants';
import { ChatError } from '@/utils/chatError';
import { Username } from '@/utils/components';

import type { NoTranslate, PSMessageTranslated, ToTranslate } from '@/i18n/types';
import type { PSCommand } from '@/types/chat';

function validateJoinphrase(phrase: string): void {
	if (!phrase) throw new ChatError('A joinphrase cannot be empty!' as ToTranslate);
	if (phrase.length > MAX_MESSAGE_LENGTH)
		throw new ChatError(`A joinphrase cannot be longer than ${MAX_MESSAGE_LENGTH} characters!` as ToTranslate);

	// Security checks
	if (phrase.startsWith('!') || phrase.startsWith('/')) {
		const VALID_COMMANDS = ['!dt', '/me'];
		if (!VALID_COMMANDS.some(cmd => phrase.startsWith(cmd + ' '))) {
			throw new ChatError('A joinphrase cannot start with a command!' as ToTranslate);
		}
	}
}

async function getRoom(message: PSMessageTranslated, arg: string): Promise<string> {
	if (message.type === 'chat') return message.target.roomid;
	if (arg) return toRoomID(arg);
	const reply = await message.target.waitFor(msg => msg.content.length > 0 && !!msg.parent.getRoom(toRoomID(msg.content)));
	if (!reply) throw new ChatError('No room provided!' as ToTranslate);
	return toRoomID(reply.content);
}

export const command: PSCommand = {
	name: 'joinphrase',
	help: 'Joinphrases module! Joinphrases are messages that are sent when a user joins a room.',
	perms: ['room', 'driver'],
	syntax: 'CMD',
	aliases: ['jp', 'joinphrases'],
	categories: ['utility'],
	extendedAliases: {
		addjp: ['joinphrase', 'add'],
		addjoinphrase: ['joinphrase', 'add'],
		ajp: ['joinphrase', 'add'],
		deletejp: ['joinphrase', 'delete'],
		deletejoinphrase: ['joinphrase', 'delete'],
		djp: ['joinphrase', 'delete'],
		removejp: ['joinphrase', 'delete'],
		remjp: ['joinphrase', 'delete'],
		ejp: ['joinphrase', 'edit'],
		editjoinphrase: ['joinphrase', 'edit'],
		getjp: ['joinphrase', 'view'],
		showjp: ['joinphrase', 'view'],
		displayjp: ['joinphrase', 'view'],
		vjp: ['joinphrase', 'view'],
		viewjp: ['joinphrase', 'view'],
	},
	children: {
		help: {
			name: 'help',
			help: 'Shows the help for the joinphrases command',
			aliases: ['h'],
			syntax: 'CMD',
			async run({ run }) {
				run('help jp');
			},
		},
		add: {
			name: 'add',
			help: 'Adds a new  joinphrase for a given user',
			flags: { allowPMs: false },
			syntax: 'CMD [user], [joinphrase]',
			aliases: ['new', 'a', 'n'],
			async run({ message, arg, $T }) {
				if (!arg) throw new ChatError($T('INVALID_ARGUMENTS'));
				const [username, phrase] = arg.lazySplit(/\s*,\s*/, 1).map(s => s.trim());
				if (!phrase) throw new ChatError($T('INVALID_ARGUMENTS'));
				const targetUser = username.trim();
				if (await getJoinphrase(targetUser, message.target.id)) {
					throw new ChatError(`${targetUser} already has a joinphrase in ${message.target.title}...` as ToTranslate);
				}
				validateJoinphrase(phrase);
				await setJoinphrase(targetUser, message.target.id, phrase, message.author.name);
				message.reply('Joinphrase Added!' as ToTranslate);
			},
		},
		view: {
			name: 'view',
			help: 'Displays a given joinphrase',
			syntax: 'CMD [user]',
			flags: { allowPMs: false },
			aliases: ['show', 'display', 'get'],
			async run({ message, arg, $T }) {
				if (!arg) throw new ChatError($T('INVALID_ARGUMENTS'));
				const targetUser = arg.trim();

				const { phrase } = (await getJoinphrase(targetUser, message.target.id)) ?? {};
				if (!phrase) throw new ChatError(`${targetUser} does not have a joinphrase in ${message.target.title}...` as ToTranslate);

				message.privateReply(`${phrase}` as NoTranslate);
			},
		},
		delete: {
			name: 'delete',
			help: "Deletes a user's joinphrase",
			syntax: 'CMD [user]',
			flags: { allowPMs: false },
			aliases: ['del', 'remove', 'rem', 'd', 'r'],
			async run({ message, arg, $T }) {
				if (!arg) throw new ChatError($T('INVALID_ARGUMENTS'));
				const targetUser = arg.trim();

				await deleteJoinphrase(targetUser, message.target.id);
				message.reply('Joinphrase deleted.' as ToTranslate);
			},
		},
		list: {
			name: 'list',
			help: 'Lists all joinphrases for a given user',
			syntax: 'CMD [user]',
			aliases: ['ls', 'l'],
			async run({ message, arg }) {
				const targetRoom = await getRoom(message, arg);
				const joinphrases = await fetchAllJoinphrases(targetRoom);

				message.replyHTML(
					<table>
						<tbody>
							{joinphrases.map(joinphrase => (
								<tr key={joinphrase.id}>
									<td>
										<Username name={joinphrase.username} clickable />
									</td>
									<td>{joinphrase.phrase}</td>
								</tr>
							))}
						</tbody>
					</table>
				);
			},
		},
		edit: {
			name: 'edit',
			help: "Edits a user's joinphrase",
			syntax: 'CMD [user], [joinphrase]',
			flags: { allowPMs: false },
			aliases: ['e', 'update'],
			async run({ message, arg, $T }) {
				if (!arg) throw new ChatError($T('INVALID_ARGUMENTS'));
				const [username, phrase] = arg.lazySplit(/\s*,\s*/, 1).map(s => s.trim());
				if (!phrase) throw new ChatError($T('INVALID_ARGUMENTS'));
				const targetUser = username.trim();
				if (!(await getJoinphrase(targetUser, message.target.id))) {
					throw new ChatError(`${targetUser} does not have a joinphrase in ${message.target.title}...` as ToTranslate);
				}
				validateJoinphrase(phrase);
				await setJoinphrase(targetUser, message.target.id, phrase, message.author.name);
				message.reply('Joinphrase edited.' as ToTranslate);
			},
		},
	},
	async run({ run, arg }) {
		if (arg) await run(`joinphrases view ${arg}`);
		else await run(`help joinphrases`);
	},
};
