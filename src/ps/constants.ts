import type { Perms } from '@/types/perms';

export const TRUSTED_USER_THROTTLE = 100;
export const REGULAR_USER_THROTTLE = 300;

// With a 100-character buffer
export const MAX_MESSAGE_LENGTH = 1900;
// With a 196-character buffer
export const MAX_CHAT_HTML_LENGTH = 8000;
// With a 500-character buffer
export const MAX_PAGE_HTML_LENGTH = 99_500;

export const KNOWN_RANK_MAPPINGS: Record<string, Perms & string> = {
	'‽': 'locked',
	'!': 'muted',
	' ': 'regular',
	'^': 'regular',
	'+': 'voice',
	'*': 'bot',
	'%': 'driver',
	'§': 'driver',
	'@': 'mod',
	'#': 'owner',
	'&': 'owner',
};

export const RANK_ORDER: (Perms & string)[] = [
	'locked',
	'muted',
	'regular',
	'whitelist',
	'voice',
	'bot',
	'driver',
	'mod',
	'owner',
	'admin',
];
