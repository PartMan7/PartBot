import type { Perms } from '@/types/perms';
import type { Message } from 'ps-client';

export type PSMessage = Message;

export type AuthKey = Perms & string;

export type PSRoomConfig = {
	roomId: string;
	roomName?: string;
	auth?: { [key in AuthKey]?: string[] } | null;
	tour?: {
		timer?: [bool: number] | [autoStart: number, autoDQ: number] | null;
	} | null;
	whitelist?: string[] | null;
	blacklist?: string[] | null;
	aliases?: string[] | null;
	private?: true | null;
	ignore?: true | null;
	// You can put both commands (eg: `quote.add`) or group perms (eg: `games.create`) here.
	permissions?: {
		[key: string]: Perms;
	} | null;
	points?: {
		types: Record<
			string,
			{
				id: string;
				singular: string;
				plural: string;
				symbol: string;
			}
		>;
		pointsPriority: string[];
		format: string;
	} | null;
	_assign?: {
		[key: string]: unknown;
	} | null;
};
