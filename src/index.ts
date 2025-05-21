import 'dotenv/config';
import '@/globals';

import { log } from '@/utils/logger';

log('PartBot is starting up...');

import '@/discord';
import '@/ps';
import '@/web';

import '@/sentinel';
