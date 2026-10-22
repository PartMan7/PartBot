import { PSEggs } from '@/cache';
import { prefix } from '@/config/ps';
import { i18n } from '@/i18n';
import { getLanguage } from '@/i18n/language';
import { ChatError } from '@/utils/chatError';
import { fromHumanTime } from '@/utils/humanTime';
import { sample } from '@/utils/random';
import { Timer } from '@/utils/timer';
import { toId } from '@/utils/toId';

import type { PSMessageTranslated, TranslationFn } from '@/i18n/types';
import type { PSCommand } from '@/types/chat';
import type { Room, User } from 'ps-client';

function validateUser(message: PSMessageTranslated, targetId: string, $T: TranslationFn): User {
	if (!targetId) throw new ChatError($T('INVALID_ARGUMENTS'));
	const isInRoom = message.target.users.some(user => toId(user) === targetId);
	if (!isInRoom) throw new ChatError($T('COMMANDS.EGG.USER_NOT_IN_ROOM'));
	const lookup = message.parent.getUser(targetId);
	if (!lookup) throw new ChatError($T('COMMANDS.EGG.USER_NOT_IN_ROOM'));
	if (lookup.name.endsWith('@!') || lookup.status?.startsWith('!(')) throw new ChatError($T('COMMANDS.EGG.TARGET_BUSY'));
	const roomUser = message.target.users.find(user => toId(user) === targetId);
	if (lookup.group === '*' || roomUser?.startsWith('*')) throw new ChatError($T('COMMANDS.EGG.TARGET_BOT'));
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

export const command: PSCommand = {
	name: 'egg',
	help: 'Toss a hot egg at someone. If you have the egg, toss it to someone else before it detonates.',
	syntax: 'CMD user',
	aliases: ['toss'],
	categories: ['casual'],
	async run({ message, arg, $T, checkPermissions }) {
		const room = message.target;
		const egg = PSEggs[room.id];

		if (!egg && !checkPermissions('whitelist')) throw new ChatError($T('ACCESS_DENIED'));

		const targetId = toId(arg);
		const authorId = message.author.id;
		const target = validateUser(message, targetId, $T);

		if (egg) {
			if (egg.holderId !== authorId) throw new ChatError($T('COMMANDS.EGG.NOT_HOLDER'));
			if (targetId === authorId) throw new ChatError($T('COMMANDS.EGG.CANNOT_TOSS_SELF'));

			egg.cycles[authorId] ??= 0;
			egg.cycles[authorId]++;
			egg.holderId = targetId;
			egg.holderName = target.name;

			egg.timer = scheduleDetonation(room, target.name, egg.timer, egg.cycles[targetId]);
			return message.reply($T('COMMANDS.EGG.TOSSED_TO', { target: target.name }));
		}

		if (targetId === authorId) throw new ChatError($T('COMMANDS.EGG.CANNOT_EGG_SELF'));

		const timer = scheduleDetonation(room, target.name, undefined, 0);
		PSEggs[room.id] = { holderId: targetId, holderName: target.name, timer, cycles: {} };
		return message.reply($T('COMMANDS.EGG.TOSSED_AT', { target: target.name, prefix }));
	},
};
