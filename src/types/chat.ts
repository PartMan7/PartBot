import type { Perms } from 'types/perms';
import type { Message as PSMessage } from 'types/ps';
import type { Message as DiscMessage } from 'discord.js';

export type PSCommand = {
	name: string,
	help?: string,
	aliases?: { [key: string]: string },
	perms?: Perms,
	rooms?: string[],
	children?: { [key: string]: PSCommand },
	run(message: PSMessage, context: { [key: string]: unknown }): Promise<void>
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
