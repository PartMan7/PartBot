import '@/globals';

const firstRun = '__FIRST_RUN__';
if (globalThis[firstRun]) {
	Logger.log('PartBot is starting up...');
	globalThis[firstRun] = true;
}

import '@/discord';
import '@/ps';
import '@/web';

import '@/sentinel';
import { Logger } from '@/utils/logger';
