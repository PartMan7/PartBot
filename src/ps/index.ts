import { Client as PSClient } from 'ps-client';
import { username, password, rooms } from '@/config/ps';

import loadPS from '@/ps/loaders';
import chatHandler from '@/ps/handlers/chat';
import interfaceHandler from '@/ps/handlers/interface';
import autoResHandler from '@/ps/handlers/autores';
import pageHandler from '@/ps/handlers/page';
import { joinHandler, nickHandler, leaveHandler } from '@/ps/handlers/joins';

const PS = new PSClient({ username, password, rooms });
PS.on('login', () => log(`Connected to PS! [${username}]`));

loadPS().then(() => PS.connect());

PS.on('message', chatHandler);
PS.on('message', interfaceHandler);
PS.on('message', autoResHandler);
PS.on('message', pageHandler);

PS.on('join', joinHandler);
PS.on('name', nickHandler);
PS.on('leave', leaveHandler);

global.PS = PS;

export default PS;
