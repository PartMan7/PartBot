/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Perms } from 'types/perms';
import type { Message as PSMessage } from 'types/ps';
import type { Message as DiscMessage } from 'discord.js';

export type PSCommandContext = {
	originalCommand: string[],
	command: string[],
	args: string[],
	run(args: string, ctxOverride?: Record<string, any>): Promise<any>,
	[key: string]: any
}

export type PSCommand = {
	name: string,
	help?: string,
	aliases?: string[],
	extendedAliases?: { [key: string]: string },
	perms?: Perms,
	rooms?: string[],
	// eslint-disable-next-line @typescript-eslint/ban-types
	static?: { [key: string]: Function },
	children?: { [key: string]: PSCommand },
	run(message: PSMessage, context: PSCommandContext): Promise<any>
}

// Will need to update this to work with slash commands
export type DiscCommand = {
	name: string,
	aliases?: { [key: string]: string },
	perms?: string[],
	guilds?: string[],
	channels?: string[],
	children?: { [key: string]: DiscCommand },
	run(message: DiscMessage, context: { [key: string]: unknown }): Promise<void>
}
