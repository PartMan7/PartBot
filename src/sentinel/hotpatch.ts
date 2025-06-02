import { promises as fs } from 'fs';
import path from 'path';
import { update as updatePSData } from 'ps-client/tools';

import { PSRoomConfigs } from '@/cache';
import { fetchRoomConfigs } from '@/database/psrooms';
import PS from '@/ps';
import { registers } from '@/sentinel/registers';
import { cachebust, cachebustDir } from '@/utils/cachebust';
import { ChatError } from '@/utils/chatError';
import { $ } from '@/utils/child_process';
import { emptyObject } from '@/utils/emptyObject';
import { fsPath } from '@/utils/fsPath';
import { errorLog, log } from '@/utils/logger';

import type { NoTranslate } from '@/i18n/types';
import type { Sentinel } from '@/sentinel/types';

export type HotpatchType = 'code' | 'data' | string;

export async function hotpatch(this: Sentinel, hotpatchType: HotpatchType, by: string | symbol): Promise<void> {
	if (!hotpatchType) throw new TypeError('Missing hotpatchType');
	try {
		// Hardcoded variants
		switch (hotpatchType) {
			case 'code': {
				$`git pull`;
				break;
			}

			case 'data': {
				await updatePSData();
				// TODO: cachebust
				break;
			}

			case 'roomconfigs':
			case 'room-configs': {
				const fetched = await fetchRoomConfigs();
				emptyObject(PSRoomConfigs);
				fetched.forEach(entry => {
					PSRoomConfigs[entry.roomId] = entry;
				});
				break;
			}

			case 'sentinel': {
				cachebust('@/sentinel/create');
				cachebust('@/sentinel/hotpatch');
				await cachebustDir(fsPath('sentinel', 'registers'));
				const newSentinel = await import('@/sentinel/create');
				this.sentinel.close();
				this.sentinel = newSentinel.create(this.emitter);
				this.hotpatch = (await import('@/sentinel/hotpatch')).hotpatch;
				break;
			}

			case 'cron':
			case 'schedule': {
				await cachebustDir(fsPath('ps', 'handlers', 'cron'));
				const { startPSCron } = await import('@/ps/handlers/cron');
				startPSCron.call(PS);
				break;
			}

			case 'secrets': {
				$`cd src/secrets; git pull`;
				await cachebustDir(fsPath('secrets'));
				break;
			}

			default:
				const register = registers.list.find(register => register.label === hotpatchType);
				if (!register) throw new ChatError(`Hotpatch type ${hotpatchType} not found.` as NoTranslate);
				const allFiles = (await fs.readdir(fsPath(), { recursive: true, withFileTypes: true }))
					.filter(entry => entry.isFile())
					.map(entry => path.join(entry.parentPath, entry.name));
				await register.reload(allFiles.filter(file => register.pattern.test(file)));
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
