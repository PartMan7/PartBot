import { Client } from 'ps-client';

import { password, rooms, username } from '@/config/ps';
import { IS_ENABLED } from '@/enabled';
import { registerEvent } from '@/ps/handlers';
import { startPSCron } from '@/ps/handlers/cron';
import { transformHTML } from '@/ps/handlers/html';
import loadPS from '@/ps/loaders';
import { log } from '@/utils/logger';

const PS = new Client({ username, password, rooms, transformHTML });
PS.on('login', () => log(`Connected to PS! [${username}]`));

if (IS_ENABLED.PS) loadPS().then(() => PS.connect());

PS.on('message', registerEvent(PS, 'commandHandler'));
PS.on('message', registerEvent(PS, 'interfaceHandler'));
PS.on('message', registerEvent(PS, 'autoResHandler'));
PS.on('message', registerEvent(PS, 'pageHandler'));

PS.on('join', registerEvent(PS, 'joinHandler'));
PS.on('name', registerEvent(PS, 'nickHandler'));
PS.on('leave', registerEvent(PS, 'leaveHandler'));
PS.on('notify', registerEvent(PS, 'notifyHandler'));
PS.on('raw', registerEvent(PS, 'rawHandler'));
PS.on('tournament', registerEvent(PS, 'tourHandler'));

if (IS_ENABLED.PS) startPSCron.bind(PS)();

export default PS;
