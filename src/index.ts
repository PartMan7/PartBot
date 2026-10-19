import 'dotenv/config';

(async () => {
	await import('@/cache/showdown');
	const { ensurePSDatacenters } = await import('@/ps/datacenters');
	await ensurePSDatacenters();

	await import('@/globals');
	const { Logger } = await import('@/utils/logger');

	Logger.log('PartBot is starting up...');

	await import('@/discord');
	await import('@/ps');
	await import('@/web');
	await import('@/sentinel');
})();
