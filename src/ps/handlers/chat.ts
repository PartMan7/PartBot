import { Message } from 'ps-client';

import { PSAliases, PSCommands } from '@/cache';
import { prefix } from '@/config/ps';
import { i18n } from '@/i18n';
import { checkPermissions } from '@/ps/handlers/permissions';
import { toId } from '@/tools';
import { ChatError } from '@/utils/chatError';
import { log } from '@/utils/logger';

import type { TranslationFn } from '@/i18n/types';
import type { PSCommand, PSCommandContext } from '@/types/chat';
import type { PSMessage } from '@/types/ps';

type Cascade = { flags: NonNullable<PSCommand['flags']>; perms: NonNullable<PSCommand['perms']> };

export function parseArgs(
	aliasArgs: string[],
	spaceCapturedArgs: string[],
	$T: TranslationFn
): {
	command: PSCommand;
	sourceCommand: PSCommand;
	commandSteps: string[];
	cascade: Cascade;
	context: PSCommandContext;
} {
	const args = aliasArgs.slice();
	let commandSet: string[] | null = null;
	for (let i = args.length; i >= 0; i--) {
		const argSet = args.slice(0, i).map(cmd => cmd.toLowerCase());
		if (PSAliases.hasOwnProperty(argSet.join(' '))) {
			commandSet = argSet;
			args.splice(0, i);
			break;
		}
	}
	if (!commandSet) throw new ChatError($T('CMD_NOT_FOUND'));
	const rawArgs = [...args];
	const originalCommand = commandSet.slice();
	const command = PSAliases[commandSet.join(' ')].split(' ');
	if (!command.length) throw new ChatError($T('CMD_NOT_FOUND'));
	const commandSteps: string[] = [];
	const context: Partial<PSCommandContext> = {
		$T,
		rawArgs,
		originalCommand,
		command: command.slice(),
		args: [],
		arg: '',
		message: undefined,
		run: undefined,
		unsafeRun: undefined,
		broadcast: undefined,
		broadcastHTML: undefined,
	};
	const sourceCommand = PSCommands[command.shift()!];
	spaceCapturedArgs.splice(0, 2);
	let commandObj: PSCommand = sourceCommand;
	if (!commandObj) throw new Error($T('INVALID_ALIAS', { aliasFor: context.command![0] }));

	const cascade: Cascade = {
		flags: commandObj.flags ?? {},
		perms: commandObj.perms ?? 'regular',
	};
	while (command.length && commandObj) {
		const next: PSCommand | undefined = commandObj.children?.[command[0]];
		if (!next) break;
		if (next.flags) {
			Object.entries(next.flags).forEach(([flag, value]) => {
				if (typeof value !== 'undefined') cascade.flags[flag as keyof typeof next.flags] = value;
			});
		}
		if (next.perms) cascade.perms = next.perms;
		commandObj = next;
		commandSteps.push(command.shift()!);
		spaceCapturedArgs.splice(0, 2);
	}
	context.args = [...command, ...args];
	context.arg = `${command.length ? command.map(cmd => `${cmd} `).join('') : ''}${spaceCapturedArgs.join('')}`;
	return { command: commandObj, sourceCommand, commandSteps, cascade, context: context as PSCommandContext };
}

function spoofMessage(argData: string, message: PSMessage, $T: TranslationFn): PSMessage {
	const [roomId, newArgData] = argData.slice(1).lazySplit(' ', 1);
	const room = message.parent.getRoom(roomId);
	if (!room) throw new ChatError($T('INVALID_ROOM_ID'));
	const by = room.users.find(user => toId(user) === message.author.id);
	if (!by) throw new ChatError($T('NOT_IN_ROOM'));
	const [empty, _type, _from, rest] = message.raw.replace(new RegExp(`${prefix}@\\S* `), prefix).lazySplit('|', 3);
	return new Message({
		type: 'chat',
		raw: [empty, 'spoof', by, rest].join('|'),
		text: `${prefix}${newArgData}`,
		by,
		target: room.id,
		time: message.time,
		isIntro: message.isIntro,
		parent: message.parent,
	});
}

export default async function chatHandler(message: PSMessage, originalMessage?: PSMessage): Promise<void> {
	if (message.isIntro || !message.author?.userid || !message.target) return;
	if (message.author.userid === message.parent.status.userid) return; // Botception!
	if (!message.content.startsWith(prefix)) return;
	try {
		const argData = message.content.substring(prefix.length);
		const $T = i18n(); // TODO: Allow overriding translations
		// Check if this is a spoof message. If so, spoof and pass to the room.
		// Will only trigger commands with `flags.routePMs` enabled.
		if (argData.startsWith('@')) {
			const mockMessage = spoofMessage(argData, message, $T);
			return chatHandler(mockMessage, message);
		}
		const args = argData.split(/ +/);
		const spacedArgs = argData.split(/( +)/);
		const {
			command: commandObj,
			sourceCommand,
			commandSteps,
			cascade: { flags, perms },
			context,
		} = parseArgs(args, spacedArgs, $T);
		const conceal = sourceCommand.flags?.conceal ? $T('CMD_NOT_FOUND') : null;
		if (!checkPermissions(perms, message)) throw new ChatError(conceal ?? $T('ACCESS_DENIED'));
		if (!flags.routePMs && originalMessage) throw new ChatError(conceal ?? $T('NO_DMS_COMMAND'));
		if (flags.roomOnly && message.type !== 'chat') throw new ChatError(conceal ?? $T('ROOM_ONLY_COMMAND'));
		if (flags.pmOnly && message.type !== 'pm') throw new ChatError(conceal ?? $T('PM_ONLY_COMMAND'));
		context.broadcast = function (msg, perm = 'voice') {
			if (checkPermissions(perm, message)) return message.reply(msg);
			else return message.privateReply(msg);
		};
		context.broadcastHTML = function (html, opts = {}) {
			const { perm = 'voice' } = opts;
			if (message.type === 'pm') return message.replyHTML(html, opts);
			if (checkPermissions(perm, message)) return message.sendHTML(html, opts);
			else return message.target.privateHTML(message.author, html, opts);
		};
		// eslint-disable-next-line @typescript-eslint/no-unused-vars -- FIXME when message overrides are supported
		context.run = function (altCommand: string, ctx: Partial<PSCommandContext> = {}, messageOverrides: Partial<PSMessage> = {}) {
			const altArgs = altCommand.split(/ +/);
			const spacedArgs = altCommand.split(/( +)/);
			const {
				command,
				sourceCommand,
				commandSteps,
				cascade: { perms },
				context,
			} = parseArgs(altArgs, spacedArgs, $T); // Note: Translations are carried over from the original command and not recalculated!
			context.calledFrom = commandSteps.join('.');
			context.calledFromMsg = message;
			// TODO Clone message and assign from overrides
			const newMessage = message;
			Object.assign(ctx, context);
			ctx.broadcast = function (msg, perm = 'voice') {
				if (checkPermissions(perm, newMessage)) return newMessage.reply(msg);
				else return newMessage.privateReply(msg);
			};
			ctx.broadcastHTML = function (html, opts = {}) {
				const { perm = 'voice' } = opts;
				if (newMessage.type === 'pm') return newMessage.replyHTML(html, opts);
				if (checkPermissions(perm, newMessage)) return newMessage.sendHTML(html, opts);
				else return newMessage.target.privateHTML(newMessage.author, html, opts);
			};
			if (!checkPermissions(perms, newMessage)) {
				throw new ChatError(sourceCommand.flags?.conceal ? $T('CMD_NOT_FOUND') : $T('ACCESS_DENIED'));
			}
			return command.run({ ...ctx, message: newMessage } as PSCommandContext);
		};
		context.unsafeRun = function (altCommand: string, ctx: Partial<PSCommandContext> = {}) {
			const altArgs = altCommand.split(/ +/);
			const spacedArgs = altCommand.split(/( +)/);
			const { command, context } = parseArgs(altArgs, spacedArgs, $T);
			context.calledFrom = commandSteps.join('.');
			context.calledFromMsg = message;
			// TODO: Clone message and assign from overrides
			const newMessage = message;
			Object.assign(ctx, context);
			ctx.broadcast = function (msg) {
				return newMessage.reply(msg);
			};
			ctx.broadcastHTML = function (html, opts) {
				return newMessage.sendHTML(html, opts);
			};
			return command.run({ ...ctx, message: newMessage } as PSCommandContext);
		};
		await commandObj.run({ ...context, message });
	} catch (_err) {
		const err = _err as Error;
		message.privateReply(err.message as string);
		if (err.name !== 'ChatError') log(err);
	}
}
