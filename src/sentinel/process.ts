import { errorLog, log } from '@/utils/logger';

export function processHandler(): { kill: () => void } {
	function errorHandler(err: Error, origin: NodeJS.UncaughtExceptionOrigin) {
		errorLog(err);
		log(`Error (${err.message}) thrown (${origin})`);
		// Everything I've read says this should exit the process
		// Unfortunately, I like living life on the edge
		// We stay alive!
	}
	function rejectionHandler(_promise: unknown, reasonPromise: Promise<unknown>) {
		errorLog(new Error(`Promise failed with reason ${reasonPromise}`));
	}
	process.on('uncaughtException', errorHandler);
	process.on('unhandledRejection', rejectionHandler);

	return {
		kill: () => {
			process.removeListener('uncaughtException', errorHandler);
			process.removeListener('unhandledRejection', rejectionHandler);
		},
	};
}
