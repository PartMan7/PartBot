export const IS_ENABLED = {
	PS: process.env.USE_PS === 'true',
	DISCORD: process.env.USE_DISCORD === 'true',
	DB: process.env.USE_DB === 'true',
	WEB: process.env.USE_WEB === 'true',
};
