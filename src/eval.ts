import _fsSync, { promises as _fs } from 'fs';
import _path from 'path';
import { inspect } from 'util';

import * as _cache from '@/cache';
import _Sentinel from '@/sentinel';
import * as _Tools from '@/tools';
import { ansiToHtml } from '@/utils/ansiToHtml';
import { cachebust as _cachebuster } from '@/utils/cachebust';
import { $ as _$ } from '@/utils/child_process';
import { fsPath as _fsPath } from '@/utils/fsPath';
import { log as _log } from '@/utils/logger';

import type { PSCommandContext } from '@/types/chat';
import type { PSMessage } from '@/types/ps';

// Exporting into side variables for eval lookup; this gets garbage-collected otherwise
const cache = _cache;
const cachebuster = _cachebuster;
const fs = _fs;
const fsSync = _fsSync;
const fsPath = _fsPath;
const log = _log;
const path = _path;
const Tools = _Tools;
const $ = _$;
const Sentinel = _Sentinel;

// Storing in context for eval()
const _evalContext = [cache, cachebuster, fs, fsSync, fsPath, log, path, Tools, $, Sentinel];

export type EvalModes = 'COLOR_OUTPUT' | 'FULL_OUTPUT' | 'ABBR_OUTPUT' | 'NO_OUTPUT';
export type EvalOutput = {
	success: boolean;
	output: string;
};

export function formatValue(value: unknown, mode: EvalModes): string {
	switch (mode) {
		case 'COLOR_OUTPUT':
		case 'FULL_OUTPUT': {
			const color = mode === 'COLOR_OUTPUT';
			// TODO Stringify functions and render with syntax highlighting
			const inspection = inspect(value, { depth: 2, colors: color, numericSeparator: true });
			return color
				? ansiToHtml(inspection)
						.replace(/\t/g, '&nbsp;'.repeat(4)) // Fill out tabs
						.replace(/ (?= |$)/g, '&nbsp;') // Fill out multi-spaces
						.replace(/\n/g, '<br/>') // Fill out newlines
				: inspection;
		}
		case 'ABBR_OUTPUT': {
			if (value instanceof Error) return value.message;
			switch (typeof value) {
				case 'string':
					return value;
				case 'number':
				case 'bigint':
				case 'boolean':
				case 'symbol':
					return value.toString();
				case 'undefined':
					return 'undefined';
				case 'function': {
					const funcStr = value.toString();
					const isAsync = funcStr.startsWith('async');
					const restFuncStr = ((funcStr: string) => {
						const funcLines = funcStr.split('\n');
						if (funcStr.startsWith('function')) {
							if (funcLines.length <= 3) {
								const [header, content] = funcStr.split('\n');
								return `${header.match(/\(.*\)/)!.toString()} => { ${content} }`;
							} else return `${funcLines[0].match(/\(.*\)/)!.toString()} => { ... }`;
						} else {
							if (funcLines.length === 1) return funcStr;
							else return `${funcLines[0]} ... }`;
						}
					})(funcStr.replace(/^async\s*/, ''));
					return `${isAsync ? 'async ' : ''}${restFuncStr}`;
				}
				case 'object': {
					if (value === null) return 'null';
					return inspect(value, { depth: 2, compact: true, maxArrayLength: 100, numericSeparator: true });
				}
				default: {
					return inspect(value) as never;
				}
			}
		}
		case 'NO_OUTPUT': {
			return '';
		}
	}
}

export async function evaluate(
	code: string,
	mode: EvalModes,
	passedContext: {
		message: PSMessage;
		context: PSCommandContext;
	} // Add Discord case here, eventually
): Promise<EvalOutput> {
	let success: boolean, value: unknown;
	try {
		const res = await (() => {
			const { message, context } = passedContext;
			// Storing in context for eval()
			const _innerEvalContext = { message, context };
			return eval(code);
		})();
		success = true;
		value = res;
	} catch (err) {
		success = false;
		value = err;
	}
	return {
		success: success,
		output: formatValue(value, mode),
	};
}
