import { Client as PSClient } from 'ps-client';
import { username, password, rooms } from 'config/ps';

const PS = new PSClient({ username, password, rooms });
PS.connect();
PS.on('login', () => console.log('Connected to PS!'));

import chatHandler from 'ps/chathandler';
PS.on('message', chatHandler);

import interfaceHandler from 'ps/interfacehandler';
PS.on('message', interfaceHandler);

import autoResHandler from 'ps/autoreshandler';
PS.on('message', autoResHandler);

export default PS;
