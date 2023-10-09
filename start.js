const { TscWatchClient } = require('tsc-watch/client');
const { execSync } = require('child_process');
const watch = new TscWatchClient();

let mainProcess;
let isFirstSuccess = true;

watch.on('first_success', async () => {
	execSync('npm run alias');
	mainProcess = require('dist').default;
	// eslint-disable-next-line no-console
	console.log(mainProcess, 'Loaded process!');
});

watch.on('success', () => {
	if (isFirstSuccess) {
		isFirstSuccess = false;
		return;
	}
	execSync('npm run alias');
	mainProcess?.emit('code-compile', 'Fire!');
});

watch.start('--noClear', '--project', 'tsconfig.json');
