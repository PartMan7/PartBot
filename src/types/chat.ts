/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Perms } from 'types/perms';
import type { Message as PSMessage } from 'ps-client';
import type { Message as DiscMessage } from 'discord.js';

export type PSCommandContext = {
	/**
	 * Name and args of the original command being passed
	 */
	originalCommand: string[];
	/**
	 * Name and args of the final unaliased command
	 */
	command: string[];
	/**
	 * Args of the final unaliased command
	 */
	args: string[];
	/**
	 * Singular argument with the user input as-is (eg: with preserved multi-spaces)
	 */
	arg: string;
	/**
	 * Executor function for command
	 * Allows commands to run other commands
	 * @param cmd Command to run (including arguments)
	 * @param ctxOverride Context to be passed to the called command function
	 */
	run(cmd: string, ctxOverride?: Record<string, any>): Promise<any>;
	/**
	 * Function that executes when the command is run.
	 * Same as run, but WILL BYPASS PERMISSION CHECKS.
	 * @param cmd Command to run (including arguments)
	 * @param ctxOverride Context to be passed to the called command function
	 */
	unsafeRun(cmd: string, ctxOverride?: Record<string, any>): Promise<any>;
	[key: string]: any;
}

export type PSCommand = {
	/**
	 * Name of the command.
	 */
	name: string;
	/**
	 * Flags to define metadata for the command.
	 */
	flags?: {
		// If enabled, hides the command from command lists
		noDisplay?: true;
		// If enabled, replaces 'access denied' errors with 'command not found'
		conceal?: true;
	};
	/**
	 * Command help message to be shown if executor function rejects without a message.
	 * Disable explicitly by passing null
	 */
	help: string | null; // Force command help if not explicitly opted-out
	/**
	 * Command syntax.
	 * Disable explicitly by passing null.
	 * For syntax formatting, see
	 */
	syntax: string | null;
	/**
	 * Aliases for the current (sub) command.
	 * @example aliases: ['c4', 'cfour'] // for the connectfour command
	 */
	aliases?: string[];
	/**
	 * Multi-word aliases for command.
	 * @example { addquote: ['quote', 'add'] }
	 */
	extendedAliases?: { [key: string]: string[] };
	/**
	 * Permissions for command.
	 * If a value is passed, allows ranks above (and including) the provided rank.
	 * If ['room', rank] or ['global', rank] is passed, checks whether the user's room/global rank is sufficient.
	 * If a function is passed, runs said function on the message and uses truthiness to determine.
	 * If a symbol is passed, looks up the permissions requirement from ps/handlers/custom-perms.
	 */
	perms?: Perms;
	/**
	 * If specified, restricts the command to only be used in those rooms.
	 */
	rooms?: string[];
	/**
	 * Static functions for use in both the command itself and external usages.
	 * Root-level only.
	 */
	// eslint-disable-next-line @typescript-eslint/ban-types
	static?: { [key: string]: Function };
	/**
	 * Subcommands of the function.
	 * Values are parsed the same way as the command itself, and may be nested.
	 */
	children?: { [key: string]: Omit<PSCommand, 'extendedAliases' | 'static'> };
	/**
	 * Function that executes when the command is run.
	 * @param message The input message
	 * @param context Relevant context for the command
	 */
	run(message: PSMessage, context: PSCommandContext): Promise<any>;
}

// Will need to update this to work with slash commands
export type DiscCommand = {
	name: string;
	aliases?: { [key: string]: string };
	perms?: string[];
	guilds?: string[];
	channels?: string[];
	children?: { [key: string]: DiscCommand };
	run(message: DiscMessage, context: { [key: string]: unknown }): Promise<void>;
}
