import { type Client, Message, type Room } from 'ps-client';

import { PSGames } from '@/cache';
import { prefix } from '@/config/ps';
import { toId } from '@/tools';
import { ChatError } from '@/utils/chatError';

import type { TranslationFn } from '@/i18n/types';
import type { PSMessage } from '@/types/ps';

export function spoof(argData: string, message: PSMessage, $T: TranslationFn): PSMessage {
	let [roomId, newArgData] = argData.lazySplit(' ', 1);
	let room: Room | undefined;
	if (roomId.startsWith('#')) {
		// This logic is game-specific handling, since the room and game type are available from ID
		// Messages will look something like `,@#GAME subcommand args`
		// This needs to be interpreted as `,@GAME.ROOM GAME.TYPE subcommand GAME.ID, args`
		const [gameId, subcommand, args] = argData.lazySplit(' ', 2);
		const game = Object.values(PSGames)
			.flatMap(games => Object.values(games))
			.find(game => game.id === gameId);
		if (!game) throw new ChatError($T('INVALID_ROOM_ID'));
		if (!subcommand) throw new ChatError($T('GAME.INVALID_INPUT'));
		room = game.room;
		newArgData = `${game.meta.id} ${subcommand} ${game.id}, ${args ?? ''}`;
	}
	if (!room) room = message.parent.getRoom(roomId);
	if (!room) throw new ChatError($T('INVALID_ROOM_ID'));
	const by = room.users.find(user => toId(user) === message.author.id);
	if (!by) throw new ChatError($T('NOT_IN_ROOM'));
	const [empty, _type, _from, rest] = message.raw.replace(new RegExp(`${prefix}@\\S* `), prefix).lazySplit('|', 3);
	return new Message({
		type: 'chat',
		raw: [empty, 'spoof', by, rest].join('|'),
		text: `${prefix}${newArgData}`,
		by,
		target: room.id,
		time: message.time,
		isIntro: message.isIntro,
		parent: message.parent,
	});
}

// TODO
export const getSpoofMessage = (text: string, room: string, PS: Client, partial?: Partial<PSMessage>): PSMessage => {
	const time = new Date();

	const message = new Message({
		by: '#Spoof',
		text,
		time: time.getTime(),
		type: 'chat',
		target: room,
		raw: `|c:|${Math.round(time.getTime() / 1000)}|#Spoof|${text}`,
		parent: PS,
		isIntro: false,
	});

	if (!partial) return message;

	Object.entries(partial).forEach(<Key extends keyof PSMessage & string>([key, value]: [key: string, value: PSMessage[Key]]) => {
		message[key as Key] = value;
	});
	return message;
};
