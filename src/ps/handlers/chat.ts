import { PSAliases, PSCommands } from 'cache';
import { prefix } from 'config/ps';
import { checkPermissions } from 'ps/handlers/permissions';

import type { Message } from 'ps-client';
import { HTMLopts } from 'ps-client/classes/common';
import type { PSCommand, PSCommandContext } from 'types/chat';
import type { Perms } from 'types/perms';
import ChatError from 'utils/chat-error';

import { ACCESS_DENIED, CMD_NOT_FOUND, INVALID_ALIAS } from 'messages';


export function getPerms (args: string[], sourceCommand: PSCommand): Perms {
	for (let i = args.length; i >= 0; i--) {
		const subCommand = args.slice(0, i).reduce((cmd, arg) => cmd.children![arg], sourceCommand);
		if (subCommand.perms) return subCommand.perms;
	}
	return 'regular';
}

export function parseArgs (aliasArgs: string[], spaceCapturedArgs: string[]): {
	command: PSCommand;
	sourceCommand: PSCommand;
	commandSteps: string[];
	context: PSCommandContext;
} {
	const args = aliasArgs.slice();
	let commandSet: string[];
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
	const commandSteps: string[] = [];
	const context: PSCommandContext = {
		rawArgs,
		originalCommand,
		command: command.slice(),
		args: [],
		arg: '',
		message: undefined,
		run: undefined,
		unsafeRun: undefined,
		broadcast: undefined,
		broadcastHTML: undefined
	};
	const sourceCommand = PSCommands[command.shift()];
	spaceCapturedArgs.splice(0, 2);
	let commandObj: PSCommand = sourceCommand;
	if (!commandObj) throw new Error(INVALID_ALIAS(context.command[0]));

	while (command.length && commandObj) {
		const next: PSCommand = commandObj.children?.[command[0]];
		if (!next) break;
		commandObj = next;
		commandSteps.push(command.shift());
		spaceCapturedArgs.splice(0, 2);
	}
	context.args = [...command, ...args];
	context.arg = `${command.length ? command.map(cmd => `${cmd} `).join('') : ''}${spaceCapturedArgs.join('')}`;
	return { command: commandObj, sourceCommand, commandSteps, context };
}

export default async function chatHandler (message: Message) {
	if (message.isIntro || !message.author.userid || !message.target) return;
	if (message.author.userid === message.parent.status.userid) return; // Botception!
	if (!message.content.startsWith(prefix)) return;
	try {
		const argData = message.content.substring(prefix.length);
		const args = argData.split(/ +/);
		const spacedArgs = argData.split(/( +)/);
		const { command: commandObj, sourceCommand, commandSteps, context } = parseArgs(args, spacedArgs);
		const requiredPerms = getPerms(commandSteps.slice(1), sourceCommand);
		if (!checkPermissions(requiredPerms, message)) throw new ChatError(sourceCommand.flags?.conceal ? CMD_NOT_FOUND : ACCESS_DENIED);
		context.broadcast = function (msg, perm = 'voice') {
			if (checkPermissions(perm, message)) return message.reply(msg);
			else return message.privateReply(msg);
		};
		context.broadcastHTML = function (html, perm = 'voice', opts) {
			if (message.type === 'pm') return message.replyHTML(html, opts);
			if (checkPermissions(perm, message)) return message.sendHTML(html, opts);
			else return message.target.privateHTML(message.author, html, opts);
		};
		context.run = function (altCommand: string, ctx: Partial<PSCommandContext> = {}, messageOverrides: Partial<Message> = {}) {
			const altArgs = altCommand.split(/ +/);
			const spacedArgs = altCommand.split(/( +)/);
			const { command, sourceCommand, commandSteps, context } = parseArgs(altArgs, spacedArgs);
			context.calledFrom = commandSteps.join('.');
			context.calledFromMsg = message;
			// TODO Clone message and assign from overrides
			const newMessage = message;
			Object.assign(context, ctx);
			ctx.broadcast = function (msg: string, perm: Perms = 'voice') {
				if (checkPermissions(perm, newMessage)) return newMessage.reply(msg);
				else return newMessage.privateReply(msg);
			};
			ctx.broadcastHTML = function (html: string, perm: Perms = 'voice', opts: HTMLopts) {
				if (newMessage.type === 'pm') return newMessage.replyHTML(html, opts);
				if (checkPermissions(perm, newMessage)) return newMessage.sendHTML(html, opts);
				else return newMessage.target.privateHTML(newMessage.author, html, opts);
			};
			const requiredPerms = getPerms(commandSteps.slice(1), sourceCommand);
			if (!checkPermissions(requiredPerms, newMessage)) throw new ChatError(sourceCommand.flags?.conceal ? CMD_NOT_FOUND : ACCESS_DENIED);
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
			// eslint-disable-next-line @typescript-eslint/no-unused-vars -- unsafeRun bypasses the perms check
			ctx.broadcast = function (msg: string, perm: Perms = 'voice') {
				return newMessage.reply(msg);
			};
			// eslint-disable-next-line @typescript-eslint/no-unused-vars -- unsafeRun bypasses the perms check
			ctx.broadcastHTML = function (html: string, perm: Perms = 'voice', opts: HTMLopts) {
				return newMessage.sendHTML(html, opts);
			};
			return command.run({ ...ctx, message: newMessage } as PSCommandContext);
		};
		await commandObj.run({ ...context, message });
	} catch (err) {
		message.privateReply(err.message);
		if (err.name !== 'ChatError') log(err);
	}
}
