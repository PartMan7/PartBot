import chokidar from 'chokidar';
import EventEmitter from 'events';
import { debounce } from '@/utils/debounce';

import { reloadCommands } from '@/ps/loaders/commands';

type Listener = { pattern: RegExp; reload: (filepath: string) => void };

export default function createSentinel() {
	const listeners: Listener[] = [
		{
			pattern: /ps\/commands\//,
			reload: async () => {
				log('Reloading commands...');
				await reloadCommands();
				log('Reloaded commands');
			},
			debounce: 1000,
		},
	].map(listener => ({ pattern: listener.pattern, reload: debounce(listener.reload, listener.debounce) }));

	const emitter = new EventEmitter();
	const sentinel = chokidar.watch(fsPath('..', 'src'), { ignoreInitial: true });
	sentinel.on('all', async (event, filepath) => {
		listeners.find(({ pattern }) => pattern.test(filepath))?.reload(filepath);
	});
	return { emitter, sentinel };
}
