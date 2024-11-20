export const token = process.env.DISCORD_TOKEN ?? 'token';
export const clientId = process.env.DISCORD_CLIENT_ID ?? 'client_id';
export const admins = process.env.DISCORD_ADMINS?.split(/ *, */) ?? [];
