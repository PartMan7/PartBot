import { Client as PSClient } from 'ps-client';
import { username, password, rooms } from 'config/ps';

const PS = new PSClient({ username, password, rooms });
PS.connect();
PS.on('login', () => log('Connected to PS!'));

import loadPS from 'ps/loaders';
loadPS();

import chatHandler from 'ps/handlers/chat';
PS.on('message', chatHandler);
import interfaceHandler from 'ps/handlers/interface';
PS.on('message', interfaceHandler);
import autoResHandler from 'ps/handlers/autores';
PS.on('message', autoResHandler);
import pageHandler from 'ps/handlers/page';
PS.on('message', pageHandler);

import { joinHandler, nickHandler, leaveHandler } from 'ps/handlers/joins';
PS.on('join', joinHandler);
PS.on('name', nickHandler);
PS.on('leave', leaveHandler);

export default PS;
