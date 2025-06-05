import { Logger } from '@/utils/logger';

export function processHandler(): { kill: () => void } {
	function errorHandler(err: Error, origin: NodeJS.UncaughtExceptionOrigin) {
		Logger.errorLog(err);
		Logger.log(`Error (${err.message}) thrown (${origin})`);
		// Everything I've read says this should exit the process
		// Unfortunately, I like living life on the edge
		// We stay alive!
	}
	function rejectionHandler(reason: unknown, _rejectedPromise: Promise<unknown>) {
		Logger.errorLog(new Error(`A promise failed with reason: ${reason}`));
		Logger.log('Promise with unhandledRejection', reason);
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
