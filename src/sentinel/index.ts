import EventEmitter from 'events';

import { create } from '@/sentinel/create';
import { hotpatch } from '@/sentinel/hotpatch';
import { Sentinel } from '@/sentinel/types';
import { log } from '@/utils/logger';

import type { Emitter } from '@/sentinel/types';

const emitter = new EventEmitter() as Emitter;
const sentinel = create(emitter);

emitter.on('complete', (label, files) => {
	log(`Reloaded ${label} with ${files.join(', ')}`);
});

emitter.on('error', (err, label, files) => {
	log(`Ran into an error while reloading ${label} for ${files.join(', ')}`, err);
});

const Sentinel: Sentinel = { hotpatch, sentinel, emitter };

export default Sentinel;
