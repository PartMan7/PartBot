import 'dotenv/config';
import '@/globals/prototypes';

import { log } from '@/utils/logger';

log('PartBot is starting up...');

import '@/database';
import '@/discord';
import '@/ps';
import '@/sentinel';
import '@/web';
