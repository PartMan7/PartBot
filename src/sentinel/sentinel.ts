import { watch } from 'chokidar';
import EventEmitter from 'events';

import { reloadCommands } from '@/ps/loaders/commands';
import { cachebuster } from '@/utils/cachebuster';
import { debounce } from '@/utils/debounce';

type ListenerType = 'commands' | 'games';
type Register = { label: ListenerType; pattern: RegExp; reload: (filepaths: string[]) => Promise<void> | void; debounce?: number };
type Listener = { label: ListenerType; pattern: RegExp; reload: (filepaths: string) => Promise<void> | void };

interface EmitterEvents {
	trigger: [label: ListenerType, file: string];
	start: [label: ListenerType, files: string[]];
	complete: [label: ListenerType, files: string[]];
	error: [error: Error, label: ListenerType, files: string[]];
}

class Emitter extends EventEmitter {
	emit<K extends keyof EmitterEvents>(event: K, ...args: EmitterEvents[K]): boolean {
		return super.emit(event, ...args);
	}
	on<K extends keyof EmitterEvents>(event: K, listener: (...args: EmitterEvents[K]) => void): this {
		return super.on(event, listener);
	}
}

export default function createSentinel() {
	const emitter = new Emitter();

	const registers: Register[] = [
		{
			label: 'commands',
			pattern: /\/ps\/commands\//,
			reload: async filepaths => {
				filepaths.forEach(cachebuster);
				return reloadCommands();
			},
			debounce: 1000,
		},
		{
			label: 'games',
			pattern: /\/ps\/games\//,
			reload: async filepaths => {
				['common', 'game', 'index', 'render'].forEach(file => cachebuster(`@/ps/games/${file}`));
				const games = filepaths.reduce((acc, filepath) => {
					const match = filepath.match(/\/ps\/games\/([^/]*)\//);
					if (match) acc.push(match[1]);
					return acc;
				}, [] as string[]);
				await Promise.all(
					games.map(async game => {
						const files = await fs.readdir(fsPath('ps', 'games', game));
						files.forEach(file => cachebuster(fsPath('ps', 'games', game, file)));
					})
				);
				// TODO: Regenerate games commands if needed
			},
			debounce: 1000,
		},
	];

	const listeners: Listener[] = registers
		.map(
			// Add debouncing
			(listener: Register): Register => {
				const start = async (filepaths: string[]) => {
					emitter.emit('start', listener.label, filepaths);
					try {
						await listener.reload(filepaths);
						emitter.emit('complete', listener.label, filepaths);
					} catch (err) {
						emitter.emit('error', err as Error, listener.label, filepaths);
					}
				};
				return {
					...listener,
					reload: listener.debounce ? debounce(start, listener.debounce) : start,
				};
			}
		)
		.map(listener => ({
			label: listener.label,
			pattern: listener.pattern,
			reload: (filepath: string) => {
				emitter.emit('trigger', listener.label, filepath);
				listener.reload([filepath]);
			},
		}));

	const sentinel = watch(fsPath('..', 'src'), { ignoreInitial: true });
	sentinel.on('all', async (event, filepath) => {
		listeners.find(({ pattern }) => pattern.test(filepath))?.reload(filepath);
	});
	return { emitter, sentinel };
}
