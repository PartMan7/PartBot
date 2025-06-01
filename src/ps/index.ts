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

PS.on('message', (...args) => LivePS.commands.commandHandler.call(PS, ...args));
PS.on('message', (...args) => LivePS.interfaceHandler.call(PS, ...args));
PS.on('message', (...args) => LivePS.autoResHandler.call(PS, ...args));
PS.on('message', (...args) => LivePS.pageHandler.call(PS, ...args));

PS.on('join', (...args) => LivePS.joinHandler.call(PS, ...args));
PS.on('name', (...args) => LivePS.nickHandler.call(PS, ...args));
PS.on('leave', (...args) => LivePS.leaveHandler.call(PS, ...args));
PS.on('notify', (...args) => LivePS.notifyHandler.call(PS, ...args));
PS.on('raw', (...args) => LivePS.rawHandler.call(PS, ...args));
PS.on('tour', (...args) => LivePS.tourHandler.call(PS, ...args));

if (IS_ENABLED.PS) startPSCron.bind(PS)();

export default PS;
