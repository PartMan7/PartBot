import '@/globals/prototypes';

import fsSync from 'fs';

import { ChatError } from '@/utils/chatError';
import { log } from '@/utils/logger';

global.fs = fsSync.promises;
global.fsSync = fsSync;

global.log = log;
global.ChatError = ChatError;
