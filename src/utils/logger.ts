/* eslint-disable no-console */
import fsSync from 'fs';
import { inspect } from 'util';
import { fsPath } from '@/utils/fsPath';

function dimText(str: string): string {
	return `\x1b[2m${str}\x1b[22m`;
}

const logStream = fsSync.createWriteStream(fsPath('..', 'logs', 'logs.txt'), { flags: 'a' });
const errLogStream = fsSync.createWriteStream(fsPath('..', 'logs', 'err-logs.txt'), { flags: 'a' });

export function log(...args): void {
	const timestamp = `[${new Date().toISOString()}]`;
	args.forEach(arg => {
		const logStr = inspect(arg, { depth: 3 });
		logStream.write(`${timestamp} ${logStr}\n`);
	});
	console.log(dimText(timestamp), ...args);
}

export function deepLog(...args): void {
	const timestamp = `[${new Date().toISOString()}]`;
	args.forEach(arg => {
		const logStr = inspect(arg, { depth: null });
		logStream.write(`${timestamp} ${logStr}\n`);
	});
	console.log(dimText(timestamp));
	args.forEach(arg => console.dir(arg, { depth: null }));
}

export function errorLog(error: Error) {
	const timestamp = `[${new Date().toISOString()}]`;
	errLogStream.write(`${timestamp} ${error.toString()}\n${error.stack || '[no stack]'}\n`);
	console.error(dimText(timestamp), error);
}

export function closeStreams(): void {
	logStream.close();
	errLogStream.close();
}
