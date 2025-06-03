import type { hotpatch } from '@/sentinel/hotpatch';
import type { FSWatcher } from 'chokidar';
import type EventEmitter from 'events';

export interface EmitterEvents {
	trigger: [label: string, file: string];
	start: [label: string, files: string[]];
	complete: [label: string, files: string[]];
	error: [error: Error, label: string, files: string[]];
}

export interface Emitter extends EventEmitter {
	emit<K extends keyof EmitterEvents>(event: K, ...args: EmitterEvents[K]): boolean;
	on<K extends keyof EmitterEvents>(event: K, listener: (...args: EmitterEvents[K]) => void): this;
}
export type Sentinel = { emitter: Emitter; sentinel: FSWatcher; hotpatch: typeof hotpatch; process: { kill: () => void } };

export type Register = { label: string; pattern: RegExp; reload: (filepaths: string[]) => Promise<void> | void; debounce?: number };
export type Listener = { label: string; pattern: RegExp; reload: (filepaths: string) => Promise<void> | void };
