import * as dotenv from 'dotenv';
import ipc from 'node-ipc';

dotenv.config();

const IPC_ID = process.env.IPC_ID || 'partbot_sentinel';

ipc.config.id = `${IPC_ID}_client`;
ipc.config.retry = 1500;

ipc.connectTo(IPC_ID, () => {
	ipc.of[IPC_ID].on('connect', () => {
		ipc.of[IPC_ID].emit('Fire!');
		ipc.disconnect(IPC_ID);
	});
});
