import type { Message, User, Room } from 'types/ps';
import type { PSCommand, PSCommandContext } from 'types/chat';

import { prefix } from 'config/ps';
import { PSAliases, PSCommands } from 'cache';

export default async function chatHandler (message: Message) {
	if (message.isIntro || !message.author.userid || !message.target) return;
	if (message.author.userid === message.parent.status.userid) return; // Botception!
	if (!message.content.startsWith(prefix)) return;
	try {
		const args = message.content.substring(prefix.length).split(/ +/);
		let commandSet: string[];
		for (let i = args.length; i > 0; i--) {
			const argSet = args.slice(0, i).map(Tools.toId);
			if (PSAliases.hasOwnProperty(argSet.join(' '))) {
				commandSet = argSet;
				args.splice(0, i);
				break;
			}
		}
		if (!commandSet) throw new ChatError('Command not found.');
		const rawArgs = [...args];
		const originalCommand = commandSet.slice();
		const command = PSAliases[commandSet.join(' ')].split(' ');
		const context: PSCommandContext = { rawArgs, originalCommand, command: command.slice(), args: [], run: undefined };
		let commandObj: PSCommand = PSCommands[command.shift()];
		if (!commandObj) throw new Error(`Had an invalid alias for ${context.command[0]}`);
		while (command.length && commandObj) {
			const next: PSCommand = commandObj.children?.[command[0]];
			if (!next) break;
			commandObj = next;
			command.shift();
		}
		context.args = [...command, ...args];
		context.run = function (altArgs: string[], ctx: Record<string, any> = {}) {
			context.calledBy = originalCommand;
			context.calledArgs = altArgs.slice();
			let commandObj: PSCommand = PSCommands[originalCommand[0]];
			while (altArgs.length && commandObj) {
				const next: PSCommand = commandObj.children?.[altArgs[0]];
				if (!next) break;
				commandObj = next;
				altArgs.shift();
			}
			Object.assign({}, context, ctx);
			context.args.unshift(...altArgs);
			return commandObj.run(message, context);
		}
		await commandObj.run(message, context);
	} catch (err) {
		message.privateReply(err.message);
		if (err.name !== 'ChatError') log(err);
	}
}
