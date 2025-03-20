import type { Perms } from '@/types/perms';
import type { Message } from 'ps-client';

export type PSMessage = Message;

type AuthKey = Perms & string;

export type PSRoomConfig = {
	roomId: string;
	roomName: string;
	auth?: { [key in AuthKey]: string[] } | null;
	tour?: {
		timer?: [bool: number] | [autoStart: number, autoDQ: number] | null;
	} | null;
	whitelist?: RegExp[] | null;
	blacklist?: RegExp[] | null;
	aliases?: string[] | null;
	private?: true | null;
	ignore?: true | null;
	permissions?: {
		[key: string]: Perms;
	} | null;
	points?: {
		types: {
			name: string;
			plur: string;
			symbol: {
				value?: string | null;
				ascii: string;
			};
		}[];
		render: {
			template?: string | null;
			override?: string[] | null;
		};
		roomId: string;
	} | null;
	_assign?: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[key: string]: any;
	} | null;
};

export type UnparsedPSRoomConfig = Omit<PSRoomConfig, 'whitelist' | 'blacklist'> & {
	whitelist?: string[] | null;
	blacklist?: string[] | null;
};
