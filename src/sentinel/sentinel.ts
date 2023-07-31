import * as chokidar from 'chokidar';

export default function createSentinel () {
	const sentinel = chokidar.watch(fsPath('..', 'src'), { ignoreInitial: true });
	sentinel.on('all', (event, path) => {
		log(event, path);
	});
	return sentinel;
}
