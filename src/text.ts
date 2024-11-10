export const ACCESS_DENIED = 'Access denied.';
export const CMD_NOT_FOUND = 'Command not found.';
export const ROOM_ONLY_COMMAND = 'This command may only be used in a chatroom.';
export const PM_ONLY_COMMAND = 'This command may only be used in private messages.';
export const NO_DMS_COMMAND = 'This command may not be run from private messages.';

export const INVALID_ALIAS = (aliasFor: string): string => {
	return `Had an invalid alias for ${aliasFor}`;
};

export const QUOTES = {
	NO_QUOTES_FOUND: 'No quotes found.',
} as const;

// Games
export const GAME = {
	NOT_STARTED: 'The game has not started yet.',
	ALREADY_STARTED: 'The game has already started!',
	ALREADY_JOINED: 'You have already joined this game.',
	IS_FULL: 'The game has no more space for players.',
	INVALID_SIDE(valid: string[]): string {
		return `Invalid side chosen! Valid sides are: ${valid.join(', ')}`; // TODO: listify
	},
	INVALID_INPUT: "That input doesn't seem to work...",
	NOT_PLAYING: [
		"You're not a player!",
		"You're not playing, weeb.",
		"You don't seem to be a player?",
		'Prayer not found. Or something like that.',
	],
	IMPOSTOR_ALERT: [
		"Hold up! Your ID doesn't match!",
		'Kinda sus, if you ask me...',
		"Wait you're not the right player for this!",
		'You are not the chosen one.',
	],
	WON_AGAINST(winner: string, loser: string, game: string, ctx?: string): string {
		return `${winner} won the game of ${game} against ${loser}!${ctx ? ` ${ctx}` : ''}`;
	},
	DRAW(...players: string[]): string {
		return `The game between ${players.join(', ')} ended in a draw!`; // TODO: listify
	},
} as const;
