import { Timers } from 'cache';
import { Timer } from 'utils/timer';

const $ = {
	messageToId (message: PSMessage) {
		return 'PS-' + message.target.id + '-' + message.author.id;
	}
};

export default {
	name: 'timer',
	help: 'Sets a timer for the given interval (in human units!) Syntax: ``PREFIXtimer`` 5 minutes // (optional reason)',
	static: $,
	children: {
		status: {
			name: 'status',
			aliases: ['left', 'count', 'togo', 'longer', 'howmuchlonger', 'ongoing', 'current'],
			help: 'Displays the current timer status',
			async run (message) {
				const id = $.messageToId(message);
				const timer = Timers[id];
				if (!timer) throw new ChatError('You don\'t have a timer running!');
				const timeLeft = Tools.toHumanTime(timer.endTime - Date.now());
				return message.reply(`Your timer will end in ${timeLeft}${timer.comment ? ` (${timer.comment})` : ''}.`);
			}
		},
		cancel: {
			name: 'cancel',
			aliases: ['terminate', 'yeet', 'stop', 'end', 'kill'],
			help: 'Cancels the ongoing timer',
			async run (message) {
				const id = $.messageToId(message);
				const timer = Timers[id];
				if (!timer) throw new ChatError('You don\'t have a timer running!');
				delete Timers[id];
				timer.cancel();
				const timeLeftText = Tools.toHumanTime(timer.endTime - Date.now());
				return message.reply(`Your timer${timer.comment ? ` (${timer.comment})` : ''} was cancelled with ${timeLeftText} left.`);
			}
		},
		run: {
			name: 'run',
			aliases: ['runearly', 'execute'],
			help: 'Makes the ongoing timer execute immediately',
			async run (message) {
				const id = $.messageToId(message);
				const timer = Timers[id];
				if (!timer) throw new ChatError('You don\'t have a timer running!');
				delete Timers[id];
				timer.execute();
				const timeLeftText = Tools.toHumanTime(timer.endTime - Date.now());
				return message.reply(`(The timer would have ended in ${timeLeftText}.)`);
			}
		}
	},
	async run (message, { args, run }) {
		const id = $.messageToId(message);
		if (Timers[id]) return run('timer status');
		const [timeText, ...commentLines] = args.join(' ').split('//');
		const comment = commentLines.join('//').trim();
		const timeToSet = Tools.fromHumanTime(timeText);
		if (!timeToSet) throw new ChatError('Please specify a time for the timer! (Remember to include units)');
		if (timeToSet > Tools.fromHumanTime('7 days')) throw new ChatError('Timers can be set for a maximum of one week.');
		Timers[id] = new Timer(() => {
			delete Timers[id];
			message.reply(`${message.author.name}, your timer is up!${comment ? ` Reason: ${comment}` : ''}`);
		}, timeToSet, comment);
		const humanFormat = Tools.toHumanTime(timeToSet);
		message.reply(`Your timer has been set for ${humanFormat} from now.`);
	}
} as PSCommand;
