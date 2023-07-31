import { Perms } from 'types/perms';
type authKey = Perms & string;

export type PSRoomConfig = {
	auth?: {
		[key in authKey]: string[]
	};
	tourTimer?: boolean | [autoStart: number, autoDQ: number];
	whitelist?: RegExp[];
	blacklist?: RegExp[];
	aliases?: string[];
	private?: true;
	ignore?: true;
	permissions?: {
		[key: string]: Perms;
	};
	points?: {
		type: {
			name: string;
			plur: string;
			symbol: {
				value?: string;
				ascii: string;
			};
		}[];
		render: {
			template?: string;
			override?: string[];
		};
		roomid: string;
	};
	_assign?: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[key: string]: any;
	};
}
