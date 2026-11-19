import { PSEggs } from '@/cache';
import { prefix } from '@/config/ps';
import { i18n } from '@/i18n';
import { getLanguage } from '@/i18n/language';
import getSecretFunction from '@/secrets/functions';
import { ChatError } from '@/utils/chatError';
import { fromHumanTime } from '@/utils/humanTime';
import { sample } from '@/utils/random';
import { Timer } from '@/utils/timer';
import { toId } from '@/utils/toId';

import type { NoTranslate, PSMessageTranslated, TranslationFn } from '@/i18n/types';
import type { PSCommand } from '@/types/chat';
import type { Room, User } from 'ps-client';

const getHiddenEggRooms = getSecretFunction('getHiddenEggRooms', () => []);

function validateUser(message: PSMessageTranslated, targetId: string, $T: TranslationFn): User {
	if (!targetId) throw new ChatError($T('INVALID_ARGUMENTS'));
	const isInRoom = message.target.users.some(user => toId(user) === targetId);
	if (!isInRoom) throw new ChatError($T('COMMANDS.EGG.USER_NOT_IN_ROOM'));
	const lookup = message.parent.getUser(targetId);
	if (!lookup) throw new ChatError($T('COMMANDS.EGG.USER_NOT_IN_ROOM'));
	if (lookup.name.endsWith('@!') || lookup.status?.startsWith('!(')) throw new ChatError($T('COMMANDS.EGG.TARGET_BUSY'));
	const roomUser = message.target.users.find(user => toId(user) === targetId);
	if (lookup.group === '*' || roomUser?.startsWith('*')) throw new ChatError($T('COMMANDS.EGG.TARGET_BOT'));
	if (lookup.group === '!' || roomUser?.startsWith('!') || lookup.group === '‽' || roomUser?.startsWith('‽')) {
		throw new ChatError($T('COMMANDS.EGG.TARGET_CANNOT_REPLY'));
	}
	return lookup;
}

function eggFuseMs(priorTossCycles: number): number {
	const scale = Math.min(2 ** priorTossCycles, 8);
	return sample([fromHumanTime('8 sec'), fromHumanTime('12 sec')]) / scale;
}

function scheduleDetonation(room: Room, holderName: string, previous?: Timer, priorTossCycles = 0): Timer {
	previous?.cancel();
	const timer = new Timer(() => {
		if (PSEggs[room.id]?.timer !== timer) return;
		delete PSEggs[room.id];
		const $T = i18n(getLanguage(room));
		room.send($T('COMMANDS.EGG.EXPLODED', { holderName }));
	}, eggFuseMs(priorTossCycles));
	return timer;
}

const rooms = ['boardgames', ...getHiddenEggRooms()];

export const command: PSCommand[] = [
	{
		name: 'egg',
		help: 'Start a hot egg by tossing it at someone. Use toss to pass it along before it detonates.',
		syntax: 'CMD user',
		categories: ['casual'],
		cooldown: fromHumanTime('30 min'),
		rooms,
		async run({ message, arg, $T, checkPermissions }) {
			const room = message.target;
			if (PSEggs[room.id]) throw new ChatError($T('COMMANDS.EGG.EGG_IN_PLAY', { prefix }));
			if (!checkPermissions('whitelist')) throw new ChatError($T('ACCESS_DENIED'));

			const targetId = toId(arg);
			const authorId = message.author.id;
			const target = validateUser(message, targetId, $T);

			if (targetId === authorId) throw new ChatError($T('COMMANDS.EGG.CANNOT_EGG_SELF'));
			if (targetId === 'siegfried' && ['conwynaut'].includes(authorId)) throw new ChatError('Weeb.' as NoTranslate); // block da weebs

			const timer = scheduleDetonation(room, target.name, undefined, 0);
			PSEggs[room.id] = { holderId: targetId, holderName: target.name, timer, cycles: {} };
			return message.reply($T('COMMANDS.EGG.TOSSED_AT', { target: target.name, prefix }));
		},
	},
	{
		name: 'toss',
		help: 'Toss the hot egg you hold to someone else before it detonates.',
		syntax: 'CMD user',
		categories: ['casual'],
		rooms,
		async run({ message, arg, $T }) {
			const room = message.target;
			const egg = PSEggs[room.id];
			if (!egg) throw new ChatError($T('COMMANDS.EGG.NO_EGG_TO_TOSS', { prefix }));

			const targetId = toId(arg);
			const authorId = message.author.id;
			const target = validateUser(message, targetId, $T);

			if (egg.holderId !== authorId) throw new ChatError($T('COMMANDS.EGG.NOT_HOLDER'));
			if (targetId === authorId) throw new ChatError($T('COMMANDS.EGG.CANNOT_TOSS_SELF'));

			egg.cycles[authorId] ??= 0;
			egg.cycles[authorId]++;
			egg.holderId = targetId;
			egg.holderName = target.name;

			egg.timer = scheduleDetonation(room, target.name, egg.timer, egg.cycles[targetId]);
			return message.reply($T('COMMANDS.EGG.TOSSED_TO', { target: target.name }));
		},
	},
];
