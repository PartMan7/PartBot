import { type FSWatcher, watch } from 'chokidar';

import { registers } from '@/sentinel/registers';
import { debounce } from '@/utils/debounce';
import { fsPath } from '@/utils/fsPath';

import type { Emitter, Listener, Register } from '@/sentinel/types';

export function create(emitter: Emitter): FSWatcher {
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
	return sentinel;
}
