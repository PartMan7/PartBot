import 'dotenv/config';
import '@/globals/prototypes';

import { log } from '@/utils/logger';

log('PartBot is starting up...');

import '@/ps';
import '@/discord';
import '@/web';
import '@/database';
import '@/sentinel';
