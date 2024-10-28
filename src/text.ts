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
