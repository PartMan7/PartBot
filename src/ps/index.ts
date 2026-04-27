import { Client } from 'ps-client';

import { avatar, password, rooms, username } from '@/config/ps';
import { IS_ENABLED } from '@/enabled';
import { registerEvent } from '@/ps/handlers';
import { initBattleManager } from '@/ps/handlers/battle';
import { startPSCron } from '@/ps/handlers/cron';
import { transformHTML } from '@/ps/handlers/html';
import loadPS from '@/ps/loaders';
import { Logger } from '@/utils/logger';

const PS = new Client({ username, password, rooms, transformHTML, avatar });
PS.on('login', () => Logger.log(`Connected to PS! [${PS.status.username}]`));

if (IS_ENABLED.PS) loadPS(PS).then(() => PS.connect());

PS.on('login', () => {
	if (IS_ENABLED.BATTLE) {
		initBattleManager(PS, {
			useHeuristic: true,
			aiLevel: 2,
			maxConcurrent: 1,
			acceptChallenges: true,
			acceptFormats: ['gen9randombattle'],
			// Enable these to auto-ladder:
			// autoLadder: true,
			// ladderFormats: ['gen9randombattle'],
		});
	}
});

PS.on('message', msg => registerEvent(PS, 'commandHandler')(msg));
PS.on('message', msg => registerEvent(PS, 'interfaceHandler')(msg));
PS.on('message', msg => registerEvent(PS, 'autoResHandler')(msg));
PS.on('message', msg => registerEvent(PS, 'otherHandler')(msg));
PS.on('message', msg => registerEvent(PS, 'battleHandler')(msg));

PS.on('join', registerEvent(PS, 'joinHandler'));
PS.on('joinRoom', registerEvent(PS, 'joinRoomHandler'));
PS.on('name', registerEvent(PS, 'nickHandler'));
PS.on('leave', registerEvent(PS, 'leaveHandler'));
PS.on('notify', registerEvent(PS, 'notifyHandler'));
PS.on('raw', registerEvent(PS, 'rawHandler'));
PS.on('tournament', registerEvent(PS, 'tourHandler'));

if (IS_ENABLED.PS) startPSCron.bind(PS)();

export default PS;
