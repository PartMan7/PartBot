import { $ } from '@/utils/child_process';
import { fsPath } from '@/utils/fsPath';

import type { Register } from '@/sentinel/types';

export const GLOBAL_REGISTERS: Register[] = [
	{
		label: 'npm',
		pattern: /package\.json$/,
		reload: () => {
			$('npm install', { cwd: fsPath('..'), stdio: 'inherit', encoding: 'utf8' });
		},
	},
];
