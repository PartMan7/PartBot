import { watch } from 'chokidar';
import EventEmitter from 'events';

import { registers } from '@/sentinel/registers';
import { debounce } from '@/utils/debounce';
import { fsPath } from '@/utils/fsPath';

import type { EmitterEvents, Listener, Register } from '@/sentinel/types';
import type { FSWatcher } from 'chokidar';

class Emitter extends EventEmitter {
	emit<K extends keyof EmitterEvents>(event: K, ...args: EmitterEvents[K]): boolean {
		return super.emit(event, ...args);
	}
	on<K extends keyof EmitterEvents>(event: K, listener: (...args: EmitterEvents[K]) => void): this {
		return super.on(event, listener);
	}
}

export default function createSentinel(): { emitter: Emitter; sentinel: FSWatcher } {
	const emitter = new Emitter();

	const listeners: Listener[] = registers.list
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
					reload: listener.debounce === 0 ? debounce(start, listener.debounce ?? 1_000) : start,
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
