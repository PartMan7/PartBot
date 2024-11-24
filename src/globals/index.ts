import '@/globals/prototypes';

import fsSync from 'fs';

global.fs = fsSync.promises;
global.fsSync = fsSync;
