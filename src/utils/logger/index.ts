/* eslint-disable no-console */
import { EmbedBuilder, WebhookClient } from 'discord.js';
import fsSync from 'fs';
import { inspect } from 'util';

import { debounce } from '@/utils/debounce';
import { fsPath } from '@/utils/fsPath';

function dimText(str: string): string {
	return `\x1b[2m${str}\x1b[22m`;
}

const logStream = fsSync.createWriteStream(fsPath('..', 'logs', 'logs.txt'), { flags: 'a' });
const errLogStream = fsSync.createWriteStream(fsPath('..', 'logs', 'err-logs.txt'), { flags: 'a' });

const LogClient = process.env.DISCORD_LOG_HOOK ? new WebhookClient({ url: process.env.DISCORD_LOG_HOOK }) : null;
const ErrorLogClient = process.env.DISCORD_ERROR_HOOK ? new WebhookClient({ url: process.env.DISCORD_ERROR_HOOK }) : null;

const dispatchLog = debounce((_logs: string[]): void => {
	if (!LogClient) return;
	const logs = _logs.length > 100 ? [..._logs.slice(0, 50), ..._logs.slice(-50)] : _logs;
	const embeds = logs.group(50).map(logGroup => {
		const embed = new EmbedBuilder();
		logGroup.group(10).forEach(set => embed.addFields({ name: '\u200b', value: set.join('\n') }));
		return embed;
	});
	LogClient.send({ embeds });
}, 5_000);

const dispatchError = debounce((_errors: Error[]): void => {
	if (!ErrorLogClient) return;
	const errors = _errors.length > 20 ? [..._errors.slice(0, 10), ..._errors.slice(-10)] : _errors;
	const embeds = errors.group(10).map(errorGroup => {
		const embed = new EmbedBuilder().setColor('Red');
		errorGroup.forEach(err => embed.addFields({ name: err.toString(), value: err.stack ?? '[no stack]' }));
		return embed;
	});
	ErrorLogClient.send({ embeds });
}, 1_000);

function log(...args: unknown[]): void {
	if (args.length === 0) return;
	const timestamp = `[${new Date().toISOString()}]`;
	args.forEach(arg => {
		const logStr = inspect(arg, { depth: 3 });
		logStream.write(`${timestamp} ${logStr}\n`);
		dispatchLog([logStr]);
	});
	console.log(dimText(timestamp), ...args);
}

function deepLog(...args: unknown[]): void {
	const timestamp = `[${new Date().toISOString()}]`;
	args.forEach(arg => {
		const logStr = inspect(arg, { depth: null });
		logStream.write(`${timestamp} ${logStr}\n`);
	});
	console.log(dimText(timestamp));
	args.forEach(arg => console.dir(arg, { depth: null }));
}

function errorLog(error: Error) {
	const timestamp = `[${new Date().toISOString()}]`;
	errLogStream.write(`${timestamp} ${error.toString()}\n${error.stack || '[no stack]'}\n`);
	dispatchError([error]);
	console.error(dimText(timestamp), error);
}

export function closeStreams(): void {
	logStream.close();
	errLogStream.close();
}

export const Logger = { log, deepLog, errorLog };
