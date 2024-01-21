import { Perms } from 'types/perms';
type AuthKey = Perms & string;

export type PSRoomConfig = {
	roomId: string;
	roomName: string;
	auth?: { [key in AuthKey]: string[] };
	tour?: {
		timer?: boolean | [autoStart: number, autoDQ: number];
	};
	whitelist?: RegExp[];
	blacklist?: RegExp[];
	aliases?: string[];
	private?: true;
	ignore?: true;
	permissions?: {
		[key: string]: Perms;
	};
	points?: {
		types: {
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
		roomId: string;
	};
	_assign?: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[key: string]: any;
	};
}

export type UnparsedPSRoomConfig = Omit<PSRoomConfig, 'whitelist' | 'blacklist'> & {
	whitelist?: string[];
	blacklist?: string[];
}
