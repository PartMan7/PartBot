import { execSync } from 'child_process';

import type { ExecSyncOptionsWithStringEncoding } from 'child_process';

export function $(input: TemplateStringsArray | string, options?: ExecSyncOptionsWithStringEncoding): string {
	const command = typeof input === 'string' ? input : input.raw.join(' ');
	return execSync(command, { encoding: 'utf8', ...options });
}
