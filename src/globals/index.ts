import '@/globals/prototypes';

import fsSync from 'fs';

import { ChatError } from '@/utils/chatError';

global.fs = fsSync.promises;
global.fsSync = fsSync;

global.ChatError = ChatError;
