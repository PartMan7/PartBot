import { PSAliases, PSCommands } from 'cache';
import { prefix } from 'config/ps';
import { checkPermissions } from 'ps/handlers/permissions';

import type { Message } from 'ps-client';
import type { PSCommand, PSCommandContext } from 'types/chat';
import type { Perms } from 'types/perms';
import ChatError from 'utils/chat-error';

const ACCESS_DENIED = 'Access denied.';
const CMD_NOT_FOUND = 'Command not found.';


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
		run: undefined,
		unsafeRun: undefined
	};
	const sourceCommand = PSCommands[command.shift()];
	spaceCapturedArgs.splice(0, 2);
	let commandObj: PSCommand = sourceCommand;
	if (!commandObj) throw new Error(`Had an invalid alias for ${context.command[0]}`);

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
		context.run = function (altCommand: string, ctx: Record<string, unknown> = {}, messageOverrides: Partial<Message> = {}) {
			const altArgs = altCommand.split(/ +/);
			const spacedArgs = altCommand.split(/( +)/);
			const { command, sourceCommand, commandSteps, context } = parseArgs(altArgs, spacedArgs);
			context.calledFrom = commandSteps.join('.');
			context.calledFromMsg = message;
			// TODO Clone message and assign from overrides
			Object.assign(context, ctx);
			const requiredPerms = getPerms(commandSteps.slice(1), sourceCommand);
			if (!checkPermissions(requiredPerms, message)) throw new ChatError(sourceCommand.flags?.conceal ? CMD_NOT_FOUND : ACCESS_DENIED);
			return command.run(message, context);
		};
		context.unsafeRun = function (altCommand: string, ctx: Record<string, unknown> = {}) {
			const altArgs = altCommand.split(/ +/);
			const spacedArgs = altCommand.split(/( +)/);
			const { command, context } = parseArgs(altArgs, spacedArgs);
			context.calledFrom = commandSteps.join('.');
			context.calledFromMsg = message;
			// TODO Clone message and assign from overrides
			Object.assign(context, ctx);
			return command.run(message, context);
		};
		await commandObj.run(message, context);
	} catch (err) {
		message.privateReply(err.message);
		if (err.name !== 'ChatError') log(err);
	}
}
