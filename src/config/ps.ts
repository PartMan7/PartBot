export const ranks = ['locked', 'muted', 'whitelist', 'voice', 'driver', 'mod', 'bot', 'owner', 'admin'] as const;
export const owner = process.env.PS_OWNER ?? 'PartMan';
export const admins = process.env.PS_ADMINS ?? ['PartMan', 'FakePart', 'The Alter', 'Azref', 'Nalsei', 'Zwelte'];
export const username = process.env.PS_USERNAME ?? 'PartBot';
export const password = process.env.PS_PASSWORD ?? 'password';
export const rooms = process.env.PS_ROOMS?.split(',') ?? ['botdevelopment'];
export const prefix = process.env.PS_PREFIX ?? process.env.PREFIX ?? ',';
