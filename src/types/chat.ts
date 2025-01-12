/* eslint-disable @typescript-eslint/no-explicit-any */

import type { TranslationFn } from '@/i18n/types';
import type { DiscInteraction } from '@/types/discord';
import type { Perms } from '@/types/perms';
import type { PSMessage } from '@/types/ps';
import type { SlashCommandBuilder } from 'discord.js';
import type { HTMLopts } from 'ps-client/classes/common';
import type { ReactElement } from 'react';

export type PSCommandContext = {
	/**
	 * The message this command is acting on
	 */
	message: PSMessage;
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
	 * (Only on forwarded messages) The original command this command was called from, delimited by '.'
	 * @example calledFrom: 'quote.add'
	 */
	calledFrom?: string;
	/**
	 * (Only on forwarded messages) The message the original command was called with
	 */
	calledFromMsg?: PSMessage;
	/**
	 * Translations function.
	 */
	$T: TranslationFn;
	/**
	 * Executor function for command
	 * Allows commands to run other commands
	 * @param cmd Command to run (including arguments)
	 * @param ctxOverride Context to be passed to the called command function
	 * @param msgOverride Overrides to be passed on the message
	 */
	run(cmd: string, ctxOverride?: Record<string, any>, msgOverride?: Partial<PSMessage>): Promise<any>;
	/**
	 * Function that executes when the command is run.
	 * Same as run, but WILL BYPASS PERMISSION CHECKS.
	 * @param cmd Command to run (including arguments)
	 * @param ctxOverride Context to be passed to the called command function
	 * @param msgOverride Overrides to be passed on the message
	 */
	unsafeRun(cmd: string, ctxOverride?: Record<string, any>, msgOverride?: Partial<PSMessage>): Promise<any>;
	/**
	 * Conditionally broadcast a message based on the given permissions
	 * @param message The message to broadcast
	 * @param perm The required permission to broadcast instead of privateReply. Defaults to 'voice'
	 */
	broadcast(message: string, perm?: Perms): void;
	/**
	 * Conditionally broadcast HTML output based on the given permissions
	 * @param html The HTML to broadcast
	 * @param opts The options to forward to the HTML call
	 * @param opts.perm The required permission to broadcast instead of privateReply. Defaults to 'voice'
	 */
	broadcastHTML(html: string | ReactElement, opts?: HTMLopts & { perm?: Perms }): void;
	[key: string]: unknown;
};

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
		noDisplay?: boolean | undefined;
		// If enabled, replaces 'access denied' errors with 'command not found'
		conceal?: boolean | undefined;
		// Ensures a command can only be run from a room
		roomOnly?: boolean | undefined;
		// Ensures a command can only be run from a PM
		pmOnly?: boolean | undefined;
		// Allows 'rerouted' PMs (eg: ,@boardgames othello join). Disabled by default.
		routePMs?: boolean | undefined;
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
	aliases?: readonly string[];
	/**
	 * Multi-word aliases for command.
	 * @example { addquote: ['quote', 'add'] }
	 */
	extendedAliases?: { [key: string]: readonly string[] };
	/**
	 * Permissions for command.
	 * If a value is passed, allows ranks above (and including) the provided rank.
	 * If ['room', rank] or ['global', rank] is passed, checks whether the user's room/global rank is sufficient.
	 * If a function is passed, runs said function on the message and uses truthiness to determine.
	 * If a symbol is passed, looks up the permissions requirement from ps/handlers/customPerms.
	 */
	perms?: Perms;
	/**
	 * If specified, restricts the command to only be used in these rooms.
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
	 * @param context Relevant context for the command
	 */
	run(context: PSCommandContext): Promise<any>;
};

// Will need to update this to work with slash commands
export type DiscCommand = {
	/**
	 * Name of the command.
	 */
	name: string;
	/**
	 * Command description.
	 */
	desc: string;
	/**
	 * Flags to define metadata for the command.
	 */
	flags?: {
		// Ensures a command can only be run from a room
		serverOnly?: true; // Handled in loaders/commands
		// Ensures a command can only be run from a PM
		pmOnly?: true; // Handled in handlers/chat
	};
	/**
	 * Aliases for the command.
	 */
	aliases?: readonly string[];
	perms?: 'admin' | ((interaction: DiscInteraction) => boolean);
	servers?: readonly string[];
	args?: (slash: SlashCommandBuilder) => void;
	run(interaction: DiscInteraction, $T: TranslationFn): Promise<any>;
};
