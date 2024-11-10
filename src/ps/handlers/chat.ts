import { Message } from 'ps-client';
import { PSAliases, PSCommands } from '@/cache';
import { prefix } from '@/config/ps';
import { checkPermissions } from '@/ps/handlers/permissions';

import type { PSCommand, PSCommandContext } from '@/types/chat';
import type { Perms } from '@/types/perms';

import { ACCESS_DENIED, CMD_NOT_FOUND, INVALID_ALIAS, NO_DMS_COMMAND, PM_ONLY_COMMAND, ROOM_ONLY_COMMAND } from '@/text';
import { ChatError } from '@/utils/chatError';

export function getPerms(args: string[], sourceCommand: PSCommand): Perms {
	for (let i = args.length; i >= 0; i--) {
		const subCommand = args.slice(0, i).reduce((cmd, arg) => cmd.children![arg], sourceCommand);
		if (subCommand.perms) return subCommand.perms;
	}
	return 'regular';
}

export function parseArgs(
	aliasArgs: string[],
	spaceCapturedArgs: string[]
): {
	command: PSCommand;
	sourceCommand: PSCommand;
	commandSteps: string[];
	flags: NonNullable<PSCommand['flags']>;
	context: PSCommandContext;
} {
	const args = aliasArgs.slice();
	let commandSet: string[] | null = null;
	const flags: PSCommand['flags'] = {};
	for (let i = args.length; i >= 0; i--) {
		const argSet = args.slice(0, i).map(Tools.toId);
		if (PSAliases.hasOwnProperty(argSet.join(' '))) {
			commandSet = argSet;
			args.splice(0, i);
			break;
		}
	}
	if (!commandSet) throw new ChatError(CMD_NOT_FOUND);
	const rawArgs = [...args];
	const originalCommand = commandSet.slice();
	const command = PSAliases[commandSet.join(' ')].split(' ');
	if (!command.length) throw new ChatError(CMD_NOT_FOUND);
	const commandSteps: string[] = [];
	const context: Partial<PSCommandContext> = {
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
	if (!commandObj) throw new Error(INVALID_ALIAS(context.command![0]));

	while (command.length && commandObj) {
		if (commandObj.flags) {
			Object.entries(commandObj.flags).forEach(([flag, value]) => {
				if (typeof value === 'boolean') flags[flag as keyof typeof commandObj.flags] = value;
			});
		}
		const next: PSCommand | undefined = commandObj.children?.[command[0]];
		if (!next) break;
		commandObj = next;
		commandSteps.push(command.shift()!);
		spaceCapturedArgs.splice(0, 2);
	}
	context.args = [...command, ...args];
	context.arg = `${command.length ? command.map(cmd => `${cmd} `).join('') : ''}${spaceCapturedArgs.join('')}`;
	// TODO: Cascade permissions
	return { command: commandObj, sourceCommand, commandSteps, flags, context: context as PSCommandContext };
}

export default async function chatHandler(message: PSMessage, originalMessage?: PSMessage): Promise<void> {
	if (message.isIntro || !message.author.userid || !message.target) return;
	if (message.author.userid === message.parent.status.userid) return; // Botception!
	if (!message.content.startsWith(prefix)) return;
	try {
		const argData = message.content.substring(prefix.length);
		// Check if this is a spoof message. If so, spoof and pass to the room.
		// Will only trigger commands with `flags.routePMs` enabled.
		if (argData.startsWith('@')) {
			const [roomId, newArgData] = argData.slice(1).lazySplit(' ', 1);
			const room = message.parent.getRoom(roomId);
			if (!room) throw new ChatError('Invalid room ID.');
			const mockMessage = new Message({
				type: 'chat',
				raw: message.raw.replace(new RegExp(`${prefix}@\\S*`), ''),
				text: `${prefix}${newArgData}`,
				by: message.author.userid,
				target: room.id,
				time: message.time,
				isIntro: message.isIntro,
				parent: message.parent,
			});
			return chatHandler(mockMessage, message);
		}
		const args = argData.split(/ +/);
		const spacedArgs = argData.split(/( +)/);
		const { command: commandObj, sourceCommand, commandSteps, flags, context } = parseArgs(args, spacedArgs);
		const requiredPerms = getPerms(commandSteps.slice(1), sourceCommand);
		const conceal = sourceCommand.flags?.conceal ? CMD_NOT_FOUND : null;
		if (!checkPermissions(requiredPerms, message)) throw new ChatError(conceal ?? ACCESS_DENIED);
		if (!flags.routePMs && originalMessage) throw new ChatError(conceal ?? NO_DMS_COMMAND);
		if (flags.roomOnly && message.type !== 'chat') throw new ChatError(conceal ?? ROOM_ONLY_COMMAND);
		if (flags.pmOnly && message.type !== 'pm') throw new ChatError(conceal ?? PM_ONLY_COMMAND);
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
		context.run = function (altCommand: string, ctx: Partial<PSCommandContext> = {}, messageOverrides: Partial<PSMessage> = {}) {
			const altArgs = altCommand.split(/ +/);
			const spacedArgs = altCommand.split(/( +)/);
			const { command, sourceCommand, commandSteps, context } = parseArgs(altArgs, spacedArgs);
			context.calledFrom = commandSteps.join('.');
			context.calledFromMsg = message;
			// TODO Clone message and assign from overrides
			const newMessage = message;
			Object.assign(context, ctx);
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
			const requiredPerms = getPerms(commandSteps.slice(1), sourceCommand);
			// TODO: Reuse upper flags logic
			if (!checkPermissions(requiredPerms, newMessage))
				throw new ChatError(sourceCommand.flags?.conceal ? CMD_NOT_FOUND : ACCESS_DENIED);
			return command.run({ ...ctx, message: newMessage } as PSCommandContext);
		};
		context.unsafeRun = function (altCommand: string, ctx: Partial<PSCommandContext> = {}) {
			const altArgs = altCommand.split(/ +/);
			const spacedArgs = altCommand.split(/( +)/);
			const { command, context } = parseArgs(altArgs, spacedArgs);
			context.calledFrom = commandSteps.join('.');
			context.calledFromMsg = message;
			// TODO Clone message and assign from overrides
			const newMessage = message;
			Object.assign(context, ctx);
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
