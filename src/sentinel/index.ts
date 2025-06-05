import EventEmitter from 'events';

import { create } from '@/sentinel/create';
import { hotpatch } from '@/sentinel/hotpatch';
import { processHandler } from '@/sentinel/process';
import { Sentinel } from '@/sentinel/types';
import { Logger } from '@/utils/logger';

import type { Emitter } from '@/sentinel/types';

const emitter = new EventEmitter() as Emitter;
const sentinel = create(emitter);

emitter.on('complete', (label, files) => {
	Logger.log(`Reloaded ${label} with ${files.join(', ')}`);
});
emitter.on('error', (err, label, files) => {
	Logger.log(`Ran into an error while reloading ${label} for ${files.join(', ')}`, err);
});

const process = processHandler();

const Sentinel: Sentinel = { hotpatch, sentinel, emitter, process };

export default Sentinel;
