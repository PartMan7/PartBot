import { Timers } from '@/cache';
import { fromHumanTime, toHumanTime } from '@/tools';
import { ChatError } from '@/utils/chatError';
import { Timer } from '@/utils/timer';

import type { PSCommand } from '@/types/chat';
import type { PSMessage } from '@/types/ps';

function messageToId(message: PSMessage): string {
	return 'PS-' + message.target.id + '-' + message.author.id;
}

export const command: PSCommand = {
	name: 'timer',
	help: 'Sets a timer for the given interval (in human units!)',
	syntax: 'CMD (time, written out) (// reason)?',
	children: {
		status: {
			name: 'status',
			aliases: ['left', 'count', 'togo', 'longer', 'howmuchlonger', 'ongoing', 'current'],
			help: 'Displays the current timer status',
			syntax: 'CMD',
			async run({ message, $T }) {
				const id = messageToId(message);
				const timer = Timers[id];
				if (!timer) throw new ChatError($T('COMMANDS.TIMER.NONE_RUNNING'));
				const timeLeft = toHumanTime(timer.endTime - Date.now(), undefined, $T);
				return message.reply($T('COMMANDS.TIMER.ENDS_IN', { timeLeft, comment: timer.comment ? ` (${timer.comment})` : '' }));
			},
		},
		cancel: {
			name: 'cancel',
			aliases: ['terminate', 'yeet', 'stop', 'end', 'kill'],
			help: 'Cancels the ongoing timer',
			syntax: 'CMD',
			async run({ message, $T }) {
				const id = messageToId(message);
				const timer = Timers[id];
				if (!timer) throw new ChatError($T('COMMANDS.TIMER.NONE_RUNNING'));
				delete Timers[id];
				timer.cancel();
				const timeLeft = toHumanTime(timer.endTime - Date.now(), undefined, $T);
				return message.reply($T('COMMANDS.TIMER.CANCELLED', { timeLeft, comment: timer.comment ? ` (${timer.comment})` : '' }));
			},
		},
		run: {
			name: 'run',
			aliases: ['runearly', 'execute'],
			help: 'Makes the ongoing timer execute immediately',
			syntax: 'CMD',
			async run({ message, $T }) {
				const id = messageToId(message);
				const timer = Timers[id];
				if (!timer) throw new ChatError($T('COMMANDS.TIMER.NONE_RUNNING'));
				delete Timers[id];
				timer.execute();
				const timeLeftText = toHumanTime(timer.endTime - Date.now(), undefined, $T);
				return message.reply($T('COMMANDS.TIMER.WOULD_HAVE_ENDED_IN', { timeLeftText }));
			},
		},
	},
	async run({ message, args, run, $T }) {
		const id = messageToId(message);
		if (Timers[id]) return run('timer status');
		const [timeText, ...commentLines] = args.join(' ').split('//');
		const comment = commentLines.join('//').trim();
		const timeToSet = fromHumanTime(timeText);
		if (!timeToSet) throw new ChatError($T('COMMANDS.TIMER.INVALID_TIME'));
		if (timeToSet > fromHumanTime('7 days')) throw new ChatError($T('COMMANDS.TIMER.MAX_TIME'));
		Timers[id] = new Timer(
			() => {
				delete Timers[id];
				message.reply(
					$T(comment ? 'COMMANDS.TIMER.TIMER_END' : 'COMMANDS.TIMER.TIMER_END_WITH_COMMENT', { user: message.author.name, comment })
				);
			},
			timeToSet,
			comment
		);
		const timeLeft = toHumanTime(timeToSet, undefined, $T);
		message.reply($T('COMMANDS.TIMER.TIMER_SET', { timeLeft }));
	},
};
