import { prefix } from '@/config/ps';
import { i18n } from '@/i18n';
import { parseArgs } from '@/ps/handlers/commands/parse';
import { checkPermissions } from '@/ps/handlers/commands/permissions';
import { spoofMessage } from '@/ps/handlers/commands/spoof';
import { ChatError } from '@/utils/chatError';
import { log } from '@/utils/logger';

import type { PSCommandContext } from '@/types/chat';
import type { PSMessage } from '@/types/ps';

type IndirectCtx =
	| {
			type: 'run';
			command: string;
			ctx: Partial<PSCommandContext>;
			bypassPerms?: boolean;
			calledFrom: {
				command: string[];
				message: PSMessage;
			};
	  }
	| {
			type: 'spoof';
			message: PSMessage;
	  };

export default async function chatHandler(message: PSMessage, indirect: IndirectCtx | null = null): Promise<void> {
	if (message.isIntro || !message.author?.userid || !message.target) return;
	if (message.author.userid === message.parent.status.userid) return; // Botception!

	const messageContent = indirect?.type === 'run' ? indirect.command : message.content;

	if (!messageContent.startsWith(prefix)) return;
	try {
		const usePermissions: typeof checkPermissions = (...args) => {
			const [perm] = args;
			if (perm === 'admin') return checkPermissions(...args); // Don't bypass for admin stuff. Just in case.
			if (indirect?.type === 'run' && indirect.bypassPerms) return true;
			return checkPermissions(...args);
		};

		const argData = messageContent.substring(prefix.length);
		const $T = i18n(); // TODO: Allow overriding translations
		// Check if this is a spoof message. If so, spoof and pass to the room.
		// Will only trigger commands with `flags.routePMs` enabled.
		if (!indirect && argData.startsWith('@')) {
			const mockMessage = spoofMessage(argData.slice(1), message, $T);
			return chatHandler(mockMessage, { type: 'spoof', message: message });
		}
		const args = argData.split(/ +/);
		const spacedArgs = argData.split(/( +)/);

		const { command: commandObj, sourceCommand, cascade, context: parsedCtx } = parseArgs(args, spacedArgs, $T);
		const context = {
			...parsedCtx,
			...(indirect?.type === 'run'
				? {
						calledFrom: indirect.calledFrom.command,
						calledFromMsg: indirect.calledFrom.message,
						...indirect.ctx,
					}
				: {}),
		};

		const conceal = sourceCommand.flags?.conceal ? $T('CMD_NOT_FOUND') : null;
		if (!usePermissions(cascade.perms, context.command, message)) throw new ChatError(conceal ?? $T('ACCESS_DENIED'));
		if (!cascade.flags.routePMs && indirect?.type === 'spoof') throw new ChatError(conceal ?? $T('NO_DMS_COMMAND'));
		if (cascade.flags.roomOnly && message.type !== 'chat') throw new ChatError(conceal ?? $T('ROOM_ONLY_COMMAND'));
		if (cascade.flags.pmOnly && message.type !== 'pm') throw new ChatError(conceal ?? $T('PM_ONLY_COMMAND'));

		context.checkPermissions = function (perm) {
			return usePermissions(perm, context.command, message);
		};

		context.broadcast = function (msg, perm = 'voice') {
			if (usePermissions(perm, null, message)) return message.reply(msg);
			else return message.privateReply(msg);
		};
		context.broadcastHTML = function (html, opts = {}) {
			const { perm = 'voice' } = opts;
			if (message.type === 'pm') return message.replyHTML(html, opts);
			if (usePermissions(perm, null, message)) return message.sendHTML(html, opts);
			else return message.target.privateHTML(message.author, html, opts);
		};

		const calledFrom = { command: context.command, message };
		// TODO: Support overriding messages
		context.run = function (command: string, ctx: Partial<PSCommandContext> = {}) {
			return chatHandler(message, { type: 'run', command: `${prefix}${command}`, calledFrom, ctx });
		};
		context.unsafeRun = function (command: string, ctx: Partial<PSCommandContext> = {}) {
			return chatHandler(message, { type: 'run', command: `${prefix}${command}`, bypassPerms: true, calledFrom, ctx });
		};

		await commandObj.run({ ...context, message });
	} catch (_err) {
		const err = _err as Error;
		message.privateReply(err.message as string);

		if (err.name !== 'ChatError') log(err);
	}
}
