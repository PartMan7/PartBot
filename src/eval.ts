import { inspect } from 'util';
import ANSIConverter from 'ansi-to-html';

export const convertANSI = ANSIConverter ? new ANSIConverter() : null;

export type EvalModes = 'COLOR_OUTPUT' | 'FULL_OUTPUT' | 'ABBR_OUTPUT' | 'NO_OUTPUT';
export type EvalOutput = {
	success: boolean;
	output: string;
};

export function formatValue(value: unknown, mode: EvalModes): string {
	switch (mode) {
		case 'COLOR_OUTPUT':
		case 'FULL_OUTPUT': {
			const color = mode === 'COLOR_OUTPUT' && !!ANSIConverter; // Cannot color without ANSIConverter
			// TODO Stringify functions and render with syntax highlighting
			const inspection = inspect(value, { depth: 2, colors: color, numericSeparator: true });
			return color
				? convertANSI
						.toHtml(inspection)
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
				case 'undefined':
					return value.toString();
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

export async function evaluate(code: string, mode: EvalModes, context: Record<string, unknown> = {}): Promise<EvalOutput> {
	let success: boolean, value: unknown;
	try {
		const res = await (() => {
			// @ts-expect-error -- Allow 'with' to forward context
			with (context) {
				return eval(code);
			}
		})();
		success = true;
		value = res;
	} catch (err) {
		success = false;
		value = err;
	}
	return {
		success: success,
		output: formatValue(value!, mode),
	};
}
