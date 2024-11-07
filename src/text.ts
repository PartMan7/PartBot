export const ACCESS_DENIED = 'Access denied.';
export const CMD_NOT_FOUND = 'Command not found.';
export const ROOM_ONLY_COMMAND = 'This command may only be used in a chatroom.';
export const PM_ONLY_COMMAND = 'This command may only be used in private messages.';

export const INVALID_ALIAS = (aliasFor: string): string => {
	return `Had an invalid alias for ${aliasFor}`;
};

export const QUOTES = {
	NO_QUOTES_FOUND: 'No quotes found.',
} as const;

// Games
export const GAME = {
	ALREADY_STARTED: 'The game has already started!',
	IS_FULL: 'The game has no more space for players.',
	INVALID_SIDE(valid: string[]): string {
		return `Invalid side chosen! Valid sides are: ${valid.join(', ')}`; // TODO: listify
	},
	NOT_PLAYING: [
		"You're not a player!",
		"You're not playing, weeb.",
		"You don't seem to be a player?",
		'Prayer not found. Or something like that.',
	],
} as const;
