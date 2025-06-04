import { errorLog, log } from '@/utils/logger';

export function processHandler(): { kill: () => void } {
	function errorHandler(err: Error, origin: NodeJS.UncaughtExceptionOrigin) {
		errorLog(err);
		log(`Error (${err.message}) thrown (${origin})`);
		// Everything I've read says this should exit the process
		// Unfortunately, I like living life on the edge
		// We stay alive!
	}
	process.on('uncaughtException', errorHandler);

	return {
		kill: () => {
			process.removeListener('uncaughtException', errorHandler);
		},
	};
}
