import { Client } from 'ps-client';

import { password, rooms, username } from '@/config/ps';
import autoResHandler from '@/ps/handlers/autores';
import chatHandler from '@/ps/handlers/chat';
import { transformHTML } from '@/ps/handlers/html';
import interfaceHandler from '@/ps/handlers/interface';
import { joinHandler, leaveHandler, nickHandler } from '@/ps/handlers/joins';
import pageHandler from '@/ps/handlers/page';
import loadPS from '@/ps/loaders';
import { log } from '@/utils/logger';

const PS = new Client({ username, password, rooms, transformHTML });
PS.on('login', () => log(`Connected to PS! [${username}]`));

if (process.env.USE_PS) loadPS().then(() => PS.connect());

PS.on('message', chatHandler);
PS.on('message', interfaceHandler);
PS.on('message', autoResHandler);
PS.on('message', pageHandler);

PS.on('join', joinHandler);
PS.on('name', nickHandler);
PS.on('leave', leaveHandler);

export default PS;
