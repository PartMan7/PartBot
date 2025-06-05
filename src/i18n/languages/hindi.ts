/* eslint-disable max-len */

import type { AvailableTranslations } from '@/i18n/types';

const translations: AvailableTranslations = {
	GRAMMAR: {
		AND: 'aur',
		OR: 'ya',
	},

	ACCESS_DENIED: 'Pahunch mana hai.',
	SCREW_YOU: ['Haan nahi', 'Chale jao!', 'Tumhe kya!'],
	CANCELLED: 'Yeh command radd kar di gayi thi.',
	CMD_NOT_FOUND: 'Command nahi mili.',
	CONFIRM: "Kya aap nishchit hain? Pushti ke liye 'confirm' likhein.",
	NOT_CONFIRMED: 'Samay par confirmation nahi mili.',
	INVALID_ALIAS: '{{aliasFor}} ke liye avaidh upnaam tha.',
	INVALID_ROOM_ID: 'Avaid room ID.',
	NO_DMS_COMMAND: 'Yeh command PMs se nahi chalai ja sakti.',
	NOT_IN_ROOM: 'Aap us room mein nahi hain.',
	PM_ONLY_COMMAND: 'Yeh command sirf PMs mein istemal ki ja sakti hai.',
	ROOM_ONLY_COMMAND: 'Yeh command sirf chatroom mein istemal ki ja sakti hai.',
	TOO_LATE: 'Bahut der ho gayi!',
	USER_NOT_FOUND: 'User nahi mila!',
	WRONG_ROOM: 'Galat room.',
	INVALID_ARGUMENTS: 'Avaid tarkik sankhya.',
	ENTRY_NOT_FOUND: 'Iss naam ka kuch nahi mila.',

	DISABLED: {
		DB: 'Database istemaal nahi ki jaa rahi hai.',
	},

	MONS: {
		NOT_FOUND: 'Pokémon {{name}} nahi mila.',
	},

	GAME: {
		ALREADY_JOINED: 'Aap is game mein pehle hi shamil ho chuke hain.',
		ALREADY_STARTED: 'Game pehle hi shuru ho chuka hai!',
		ALREADY_WATCHING: 'Aap is game ko pehle hi dekh rahe hain!',
		COMMAND_NOT_ENABLED: 'Yeh command {{game}} ke liye sakriya nahi hai.',
		DRAW: 'Game {{players}} ke beech mein barabar raha!',
		ENDED: 'Game {{game}} [{{id}}] samapt ho gaya hai.',
		ENDED_AUTOMATICALLY: 'Game {{game}} [{{id}}] svachalit roop se samapt ho gaya hai.',
		IMPOSTOR_ALERT: ['Aap ye nahi kar sakte.', 'Mujhe lagta hai kuchh gadbad hai...'],
		INVALID_INPUT: 'Woh input kaam nahi kar raha lagta...',
		INVALID_SIDE: 'Avaid paksh chuna gaya! Sahi paksh hain: {{sides}}',
		IN_PROGRESS: 'Yeh game pehle hi chal raha hai. Weeb.',
		IS_FULL: 'Game mein ab aur khiladi nahi liye ja sakte.',
		NOT_FOUND: 'Aap jo game chahte the, woh nahi mila...',
		NOT_PLAYING: ['Aap khiladi nahi hain!', 'Aap nahi khel rahe ho, weeb.', 'Aap khiladi nahi lagte?'],
		NOT_STARTED: 'Game abhi tak shuru nahi hua hai.',
		CANNOT_START: 'Game shuru nahi kiya ja sakta! Kripya khiladiyon ko dekhein.',
		NOT_WATCHING: 'Aap is game ko nahi dekh rahe ho...',
		NOW_WATCHING: 'Aap ab {{game}} game ko dekh rahe hain, jo {{players}} ke beech ho raha hai.',
		NO_LONGER_WATCHING: 'Aap ab {{game}} game ko nahi dekh rahe hain, jo {{players}} ke beech ho raha tha.',
		RESTORED: 'Game {{id}} ko wapas chalu kiya gaya hai.',
		RESTORING_WRONG_TYPE: 'Aap galat prakar ka khel chalu karne ki koshish kar rahe hain...',
		STASHED: 'Safaltapoorvak khel {{id}} ko stash kiya gaya.',
		SUB: '{{out}} ko {{in}} se replace kar diya gaya!',
		WATCHING_NOTHING: 'Aapko kuchh dobara join karne ki avashyakta nahi lagti...',
		WON: '{{winner}} jeet gaya!',
		WON_AGAINST: '{{winner}} ne {{game}} khel mein {{loser}} ko {{ctx}} ke saath hara diya!',
		WAITING: 'Aapke khelne ka intezaar ho raha hai...',
		NON_PLAYER_OR_SPEC: 'Upayogakarta khiladiyon/spectators mein nahi hai',
		YOUR_TURN: 'Aapka turn!',
		UPLOAD_FAILED: 'Game {{id}} ko upload karne mein asafalta.',
		MOD_NOT_FOUND: "'{{mod}}' naam ka mod nahi mila.",
		CANNOT_MOD: 'Mods ko ab is khel mein lagu nahi kiya ja sakta.',
		APPLIED_MOD: '{{mod}} ko khel {{id}} mein lagu kiya gaya.',
		NO_THEME_SUPPORT: '{{game}} themes ko samarthit nahi karta.',
		INVALID_THEME: 'Avaid theme. Sahi themes hain: {{themes}}.',
		SET_THEME: 'Theme ko {{theme}} par set kiya gaya.',
		CANNOT_LEAVE: 'Aap khel ko band karke chhodega nahi kar sakte! Kripya ``{{prefix}}{{game}} forfeit`` ka istemal karein.',
		TIMER: {
			PRIVATE: 'Psst, {{game}} mei aapka turn hai [{{id}}]',
			PUBLIC: '{{user}} ne {{game}} [{{id}}] mein {{time}} se khel nahi kiya...',
		},

		LIGHTS_OUT: {
			INVALID_SIZE: 'Lights Out sirf 3x5 se 9x10 tak ka ho sakta hai.',
		},
		MASTERMIND: {
			ENDED: 'Mastermind ka game {{player}} ke liye samapt ho gaya.',
			FAILED: '{{player}} {{solution}} ko {{cap}} andazon mein nahi guess kar paya.',
		},
		SCRABBLE: {
			NO_SELECTED: 'Kripya pehle ek cell chunein jahan se khelna hai. Buttons ka upyog karein!',
			TILE_MISMATCH:
				'Woh move board par tiles ke saath milta hua nahi lagta - {{placed}} ko {{actual}} par rakhne ki koshish ki gayi.',
			MISSING_LETTER: 'Aapke paas {{letter}} ke liye koi tile nahi hai.',
			INSUFFICIENT_LETTERS: 'Aapke paas sirf {{letter}} ke {{actual}} tiles hain, jabki {{required}} chahiye the.',
			BAG_SIZE: 'Bag mein abhi {{amount}} tiles bache hain.',
			TOO_MUCH_PASSING: 'Bahut zyada pass hone ke kaaran khel samaapt ho gaya!',
			FIRST_MOVE_CENTER: 'Pehla move board ke center se guzarna chahiye!',
			FIRST_MOVE_MULTIPLE_TILES: 'Pehle move mein aap sirf ek tile nahi khel sakte.',
			MUST_BE_CONNECTED: 'Scrabble ke sabhi moves board ke baaki tiles se jude hone chahiye!',
			MUST_PLAY_TILES: 'Aapke move mein kam se kam ek tile toh khela jaana chahiye.',
			INVALID_WORD: '{{wordList}} ek maany shabd nahi hai.',
			INVALID_WORDS: '{{wordList}} maany shabd nahi hain.',
			VALID_WORD: '{{word}} {{mod}} mein ek maany shabd hai.',
			HOW_TO_BLANK:
				"Hi, aapne ek blank tile uthaya hai! Blank tile kisi bhi letter ke roop mein istemal ho sakta hai, lekin yeh 0 points deta hai. Aap `BL[A]NK` (example ke liye) likhkar blank ko A jaise upyog kar sakte hain. Anya format hain `BL(A)NK`, ya blanked letter ke baad apostrophe daalna (jaise: `BLA'NK`).",
		},
	},
	COMMANDS: {
		ALTS: 'Alts: {{alts}}',
		BOOP: 'BOOP',
		UPTIME: 'Bot {{time}} se chal raha hai.',
		RANK: 'Aapka rank hai {{rank}}.',
		PONG: 'Pong!',
		ROOM_NOT_GIVEN: 'Ek minute ke andar koi room prapt nahi hua',

		EVAL: {
			SUCCESS: 'Command safaltapoorvak chalayi gayi.',
			ERROR: 'Command chalate samay error aaya: {{error}}',
		},

		POINTS: {
			ROOM_NO_POINTS: '{{room}} mein points enabled nahi hain.',
			USER_NO_POINTS: '[[]]{{user}} ke paas is room mein koi points nahi hain.',
			USER_POINTS: '[[]]{{user}} ke paas {{roomName}} mein {{pointsList}} hain.',
			USER_POINTS_RANKED: '[[]]{{user}} {{roomName}} mein {{pointsList}} ke saath #{{rank}} par hai.',
			HEADERS: {
				USER: 'User',
			},
		},

		QUOTES: {
			NO_QUOTES_FOUND: 'Koi quotes nahi mile.',
		},

		TIMER: {
			NONE_RUNNING: 'Aapke paas koi timer nahi chal raha hai!',
			ENDS_IN: 'Aapka timer {{timeLeft}}{{comment}} mein khatam hoga.',
			WOULD_HAVE_ENDED_IN: '(Timer {{timeLeft}} mein khatam hota.)',
			CANCELLED: 'Aapka timer{{comment}} {{timeLeft}} bacha hone par radd kar diya gaya.',
			MAX_TIME: 'Timers ko adhiktam ek hafte tak set kiya ja sakta hai.',
			INVALID_TIME: 'Timer ke liye kripya ek samay batayein! (Units samet)',
			TIMER_END: '{{user}}, aapka timer samapt ho gaya hai!',
			TIMER_END_WITH_COMMENT: '{{user}}, aapka timer samapt ho gaya hai! Karan: {{comment}}',
			TIMER_SET: 'Aapka timer ab se {{timeLeft}} ke liye set kiya gaya hai.',
		},
	},
};

export default translations;
