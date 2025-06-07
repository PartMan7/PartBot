import { promises as fs } from 'fs';
import path from 'path';
import { update as updatePSData } from 'ps-client/tools';

import { PSRoomConfigs } from '@/cache';
import { updateShowdownData } from '@/cache/showdown';
import { fetchRoomConfigs } from '@/database/psrooms';
import { type Language, LanguageMap } from '@/i18n';
import PS from '@/ps';
import { registers } from '@/sentinel/registers';
import { cachebust, cachebustDir } from '@/utils/cachebust';
import { ChatError } from '@/utils/chatError';
import { $ } from '@/utils/child_process';
import { emptyObject } from '@/utils/emptyObject';
import { fsPath } from '@/utils/fsPath';
import { Logger } from '@/utils/logger';

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

			case 'sentinel': {
				cachebust('@/sentinel/create');
				cachebust('@/sentinel/hotpatch');
				cachebust('@/sentinel/process');
				await cachebustDir(fsPath('sentinel', 'registers'));
				const newSentinel = await import('@/sentinel/create');
				this.sentinel.close();
				this.process.kill();
				this.sentinel = newSentinel.create(this.emitter);
				this.hotpatch = (await import('@/sentinel/hotpatch')).hotpatch;
				this.process = (await import('@/sentinel/process')).processHandler();
				break;
			}

			case 'logger': {
				const { closeStreams } = await import('@/utils/logger');
				closeStreams();
				cachebust('@/utils/logger');

				const { Logger: NewLogger } = await import('@/utils/logger');
				Object.assign(Logger, NewLogger);
				break;
			}

			case 'i18n': {
				emptyObject(LanguageMap);
				await cachebustDir(fsPath('i18n', 'languages'));
				const languages = (await fs.readdir(fsPath('i18n', 'languages')))
					.filter(file => file.endsWith('.ts'))
					.map(file => file.replace('.ts', ''));
				await Promise.all(
					languages.map(async language => {
						const { default: dict } = await import(fsPath('i18n', 'languages', language));
						LanguageMap[language as Language] = dict;
					})
				);
				break;
			}

			case 'showdown': {
				await updateShowdownData();
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

			case 'commands': {
				const commandsRegister = registers.list.find(register => register.label === 'commands')!;
				await cachebustDir(fsPath('ps', 'commands'));
				await commandsRegister.reload([]);
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
		Logger.log(`${hotpatchType} was hotpatched ${typeof by === 'symbol' ? `(${Symbol.keyFor(by) ?? '-'})` : `by ${by}`}`);
	} catch (error) {
		if (error instanceof Error) {
			Logger.log('Failed to hotpatch', hotpatchType, by, error.message);
			Logger.errorLog(error);
		}
		if (error instanceof ChatError) return;
		throw error;
	}
}
