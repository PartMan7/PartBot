export default {
	// Grammar
	GRAMMAR: {
		AND: 'and',
	},

	BOOP: 'BOOP',
	ACCESS_DENIED: 'Access denied.',
	CMD_NOT_FOUND: 'Command not found.',
	ROOM_ONLY_COMMAND: 'This command may only be used in a chatroom.',
	PM_ONLY_COMMAND: 'This command may only be used in private messages.',
	NO_DMS_COMMAND: 'This command may not be run from private messages.',
	INVALID_ALIAS: `Had an invalid alias for {{aliasFor}}.`,

	QUOTES: {
		NO_QUOTES_FOUND: 'No quotes found.',
	},

	// Games
	GAME: {
		NOT_FOUND: 'Could not find the game you meant...',
		NOT_STARTED: 'The game has not started yet.',
		ALREADY_STARTED: 'The game has already started!',
		ALREADY_JOINED: 'You have already joined this game.',
		NOW_WATCHING: 'You are now watching the game of {{game}} between {{players}}.',
		ALREADY_WATCHING: 'You are already watching this game!',
		NO_LONGER_WATCHING: 'You are no longer watching the game of {{game}} between {{players}}.',
		NOT_WATCHING: "You aren't watching this game, though...",
		WATCHING_NOTHING: "You don't seem to need to rejoin anything...",
		ENDED: `The game of {{game}} [{{id}}] has been ended.`,
		ENDED_AUTOMATICALLY: `The game of {{game}} [{{id}}] has ended automatically.`,
		IS_FULL: 'The game has no more space for players.',
		INVALID_SIDE: `Invalid side chosen! Valid sides are: {{sides}}`,
		INVALID_INPUT: "That input doesn't seem to work...",
		SUB: '{{out}} has been subbed with {{in}}!',
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
		WON_AGAINST: `{{winner}} won the game of {{game}} against {{loser}}!{{ctx}}`,
		DRAW: `The game between {{players}} ended in a draw!`,
	},
};
