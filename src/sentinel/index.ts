import createSentinel from '@/sentinel/sentinel';
import { log } from '@/utils/logger';
const { emitter, sentinel } = createSentinel();

emitter.on('complete', (label, files) => {
	log(`Reloaded ${label} with ${files.join(', ')}`);
});

emitter.on('error', (err, label, files) => {
	log(`Ran into an error while reloading ${label} for ${files.join(', ')}`, err);
});

export { emitter, sentinel };
