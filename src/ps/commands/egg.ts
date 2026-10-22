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

function eggFuseMs(alreadyPassed: boolean): number {
	if (alreadyPassed) return sample([fromHumanTime('3 sec'), fromHumanTime('5 sec')]);
	return sample([fromHumanTime('8 sec'), fromHumanTime('12 sec')]);
}

function scheduleDetonation(room: Room, holderName: string, previous?: Timer, alreadyPassed = false): Timer {
	previous?.cancel();
	const timer = new Timer(() => {
		if (PSEggs[room.id]?.timer !== timer) return;
		delete PSEggs[room.id];
		const $T = i18n(getLanguage(room));
		room.send($T('COMMANDS.EGG.EXPLODED', { holderName }));
	}, eggFuseMs(alreadyPassed));
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

			egg.passed.add(authorId);
			const alreadyPassed = egg.passed.has(targetId);
			const timer = scheduleDetonation(room, target.name, egg.timer, alreadyPassed);
			PSEggs[room.id] = { holderId: targetId, holderName: target.name, timer, passed: egg.passed };
			return message.reply($T('COMMANDS.EGG.TOSSED_TO', { target: target.name }));
		}

		if (targetId === authorId) throw new ChatError($T('COMMANDS.EGG.CANNOT_EGG_SELF'));

		const passed = new Set([authorId]);
		const timer = scheduleDetonation(room, target.name, undefined, passed.has(targetId));
		PSEggs[room.id] = { holderId: targetId, holderName: target.name, timer, passed };
		return message.reply($T('COMMANDS.EGG.TOSSED_AT', { target: target.name, prefix }));
	},
};
