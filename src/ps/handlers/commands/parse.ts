import { PSAliases, PSCommands } from '@/cache';
import { ChatError } from '@/utils/chatError';

import type { TranslationFn } from '@/i18n/types';
import type { PSCommand, PSCommandChild, PSCommandContext } from '@/types/chat';

type Cascade = { flags: NonNullable<PSCommand['flags']>; perms: NonNullable<PSCommand['perms']> };

export function parse(
	aliasArgs: string[],
	spaceCapturedArgs: string[],
	$T: TranslationFn
): {
	command: PSCommandChild;
	sourceCommand: PSCommand;
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
	const context: Partial<PSCommandContext> = {
		$T,
		rawArgs,
		originalCommand,
		command: command.slice(),
		args: [],
		arg: '',
	};
	const sourceCommand = PSCommands[command.shift()!];
	let commandObj: PSCommandChild = sourceCommand;
	if (!commandObj) throw new Error($T('INVALID_ALIAS', { aliasFor: context.command![0] }));

	const cascade: Cascade = {
		flags: commandObj.flags ?? {},
		perms: commandObj.perms ?? 'regular',
	};
	while (command.length > 0 && commandObj) {
		const next: PSCommandChild | undefined = commandObj.children?.[command[0]];
		if (!next) break;
		if (next.flags) {
			Object.entries(next.flags).forEach(([flag, value]) => {
				if (typeof value !== 'undefined') cascade.flags[flag as keyof typeof next.flags] = value;
			});
		}
		if (next.perms) cascade.perms = next.perms;
		commandObj = next;
		command.shift();
	}
	originalCommand.length.times(() => spaceCapturedArgs.splice(0, 2));
	context.args = [...command, ...args];
	context.arg = `${command.length ? command.map(cmd => `${cmd} `).join('') : ''}${spaceCapturedArgs.join('')}`;
	return { command: commandObj, sourceCommand, cascade, context: context as PSCommandContext };
}
