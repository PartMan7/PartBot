import 'dotenv/config';
import '@/globals';

Logger.log('PartBot is starting up...');

import '@/discord';
import '@/ps';
import '@/web';

import '@/sentinel';
import { Logger } from '@/utils/logger';
