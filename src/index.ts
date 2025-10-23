import 'dotenv/config';
import '@/globals';
import { Logger } from '@/utils/logger';

Logger.log('PartBot is starting up...');

import '@/discord';
import '@/ps';
import '@/web';

import '@/sentinel';
