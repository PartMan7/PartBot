import { promises as fs } from 'fs';
import path from 'path';
import { update } from 'ps-client/tools';

import { registers } from '@/sentinel/registers';
import { $ } from '@/utils/child_process';
import { fsPath } from '@/utils/fsPath';
import { errorLog, log } from '@/utils/logger';

export type HotpatchType = 'code' | 'data' | string;

export async function hotpatch(hotpatchType: HotpatchType, by: string | symbol): Promise<void> {
	if (!hotpatchType) throw new TypeError('Missing hotpatchType');
	try {
		// Hardcoded variants
		switch (hotpatchType) {
			case 'code': {
				$`git pull`;
				break;
			}
			case 'data': {
				await update();
				// TODO: cachebust
				break;
			}
			default:
				const register = registers.list.find(register => register.label === hotpatchType);
				if (register) {
					const allFiles = (await fs.readdir(fsPath(), { recursive: true, withFileTypes: true }))
						.filter(entry => entry.isFile())
						.map(entry => path.join(entry.parentPath, entry.name));
					await register.reload(allFiles.filter(file => register.pattern.test(file)));
				}
		}
		log(`${hotpatchType} was hotpatched ${typeof by === 'symbol' ? `(${Symbol.keyFor(by) ?? '-'})` : `by ${by}`}`);
	} catch (error) {
		if (error instanceof Error) {
			log('Failed to hotpatch', hotpatchType, by, error.message);
			errorLog(error);
		}
		throw error;
	}
}
