import { Client } from 'ps-client';

import { password, rooms, username } from '@/config/ps';
import { IS_ENABLED } from '@/enabled';
import { autoResHandler } from '@/ps/handlers/autores';
import { commandHandler } from '@/ps/handlers/commands';
import { startPSCron } from '@/ps/handlers/cron';
import { transformHTML } from '@/ps/handlers/html';
import { interfaceHandler } from '@/ps/handlers/interface';
import { joinHandler, leaveHandler, nickHandler } from '@/ps/handlers/joins';
import { pageHandler } from '@/ps/handlers/page';
import { rawHandler } from '@/ps/handlers/raw';
import loadPS from '@/ps/loaders';
import { log } from '@/utils/logger';

const PS = new Client({ username, password, rooms, transformHTML });
PS.on('login', () => log(`Connected to PS! [${username}]`));

if (IS_ENABLED.PS) loadPS().then(() => PS.connect());

PS.on('message', commandHandler);
PS.on('message', interfaceHandler);
PS.on('message', autoResHandler);
PS.on('message', pageHandler);

PS.on('join', joinHandler);
PS.on('name', nickHandler);
PS.on('leave', leaveHandler);
PS.on('raw', rawHandler);

if (IS_ENABLED.PS) startPSCron(PS);

export default PS;
