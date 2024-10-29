import createSentinel from '@/sentinel/sentinel';
const { emitter, sentinel } = createSentinel();

emitter.on('trigger', (label, file) => {
	log(`Triggered ${label} reload from ${file}`);
});

emitter.on('start', (label, files) => {
	log(`Started ${label} reload with ${files.join(', ')}`);
});

emitter.on('complete', (label, files) => {
	log(`Completed ${label} reload with ${files.join(', ')}`);
});

emitter.on('error', (err, label, files) => {
	log(`Ran into an error while reloading ${label} for ${files.join(', ')}`, err);
});

export { emitter, sentinel };
