import * as chokidar from 'chokidar';

import EventEmitter from 'events';

// const IPC_ID = process.env.IPC_ID || 'partbot_sentinel';
// ipc.config.id = IPC_ID;
// ipc.config.retry = 1500;

// log('Hit 0');
// ipc.serve(() => {
// 	log('Hit 1');
// 	ipc.server.on('message', data => {
// 		log('Hit 2');
// 		log(data, eyesOn);
// 		eyesOn.forEach(file => listeners.find(({ pattern }) => pattern.test(file))?.reload(file));
// 	});
// });
// ipc.server.start();

import { reloadCommands } from 'ps/loaders/commands';

export default function createSentinel () {
	const eyesOn: string[] = [];
	const listeners: { pattern: RegExp, reload: (filepath) => Promise<void> }[] = [{
		pattern: /ps\/commands\//,
		reload: async (filepath) => {
			log('Reloading commands...', filepath);
			await reloadCommands();
			log('Reloaded commands');
		}
	}];

	const emitter = new EventEmitter();
	const sentinel = chokidar.watch(fsPath('..', 'src'), { ignoreInitial: true });
	sentinel.on('all', async (event, filepath) => {
		log(event, filepath);
		eyesOn.push(filepath);
		// listeners.find(({ pattern }) => pattern.test(filepath))?.reload(filepath);
	});
	emitter.on('code-compile', () => {
		eyesOn.forEach(file => listeners.find(({ pattern }) => pattern.test(file))?.reload(file));
	});
	return { emitter, sentinel };
}
