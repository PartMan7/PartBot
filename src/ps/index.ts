import { Client } from 'ps-client';

import { password, rooms, username } from '@/config/ps';
import { IS_ENABLED } from '@/enabled';
import { startPSCron } from '@/ps/handlers/cron';
import { transformHTML } from '@/ps/handlers/html';
import loadPS from '@/ps/loaders';
import { LivePS } from '@/sentinel/live';
import { log } from '@/utils/logger';

const PS = new Client({ username, password, rooms, transformHTML });
PS.on('login', () => log(`Connected to PS! [${username}]`));

if (IS_ENABLED.PS) loadPS().then(() => PS.connect());

PS.on('message', LivePS.commandHandler.bind(PS));
PS.on('message', LivePS.interfaceHandler.bind(PS));
PS.on('message', LivePS.autoResHandler.bind(PS));
PS.on('message', LivePS.pageHandler.bind(PS));

PS.on('join', LivePS.joinHandler.bind(PS));
PS.on('name', LivePS.nickHandler.bind(PS));
PS.on('leave', LivePS.leaveHandler.bind(PS));
PS.on('raw', LivePS.rawHandler.bind(PS));

if (IS_ENABLED.PS) startPSCron.bind(PS);

export default PS;
