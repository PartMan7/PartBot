import { PSActiveRepeats } from '@/cache';
import { prefix } from '@/config/ps';
import { addRepeat, fetchRoomRepeats, removeRepeat } from '@/database/repeats';
import { MAX_MESSAGE_LENGTH } from '@/ps/constants';
import { startRepeat, stopRepeat } from '@/ps/repeats';
import { ChatError } from '@/utils/chatError';
import { Username } from '@/utils/components';
import { fromHumanTime, toHumanTime } from '@/utils/humanTime';
import { toId } from '@/utils/toId';

import type { TranslationFn } from '@/i18n/types';
import type { PSCommand } from '@/types/chat';

function validateMessage(message: string, $T: TranslationFn): void {
	if (!message) throw new ChatError($T('INVALID_ARGUMENTS'));
	if (message.length > MAX_MESSAGE_LENGTH) throw new ChatError($T('COMMANDS.REPEAT.MESSAGE_TOO_LONG', { max: MAX_MESSAGE_LENGTH }));
	if (message.startsWith('!') || message.startsWith('/')) {
		const VALID_COMMANDS = ['!dt', '/me', '!ld top'];
		if (!VALID_COMMANDS.some(cmd => message.startsWith(cmd + ' ') || message === cmd)) {
			throw new ChatError($T('COMMANDS.REPEAT.NO_COMMANDS'));
		}
	}
}

export const command: PSCommand[] = [
	{
		name: 'repeat',
		help: 'Sets a repeating message in the room.',
		syntax: 'CMD [id], [interval], [content]',
		perms: 'driver',
		categories: ['utility'],
		async run({ message, arg, $T }) {
			const [idRaw, intervalRaw, content] = arg.lazySplit(/\s*,\s*/, 2);
			if (!content) throw new ChatError($T('INVALID_ARGUMENTS'));

			const id = toId(idRaw);
			const interval = fromHumanTime(intervalRaw);

			if (!id || !content.trim()) throw new ChatError($T('INVALID_ARGUMENTS'));
			if (!interval) throw new ChatError($T('INTERVAL_HELP'));

			const repeatKey = `${message.target.id}:${id}`;
			if (PSActiveRepeats.get(repeatKey)) throw new ChatError($T('COMMANDS.REPEAT.ALREADY_EXISTS', { id, prefix }));
			if (interval < fromHumanTime('1 minute')) throw new ChatError($T('COMMANDS.REPEAT.MIN_INTERVAL'));

			validateMessage(content, $T);

			const repeatData = {
				room: message.target.id,
				startedBy: message.author.name,
				startedAt: Date.now(),
				id,
				interval,
				author: message.author.name,
				content,
			};

			await addRepeat(repeatData);
			startRepeat(message.parent, repeatData, null);

			message.reply($T('COMMANDS.REPEAT.SUCCESS', { id, interval: toHumanTime(interval, undefined, $T) }));
		},
	},
	{
		name: 'endrepeat',
		help: 'Stops a repeating message',
		syntax: 'CMD [id]',
		perms: 'driver',
		categories: ['utility'],
		async run({ message, arg, $T }) {
			const id = toId(arg);
			if (!id) throw new ChatError($T('INVALID_ARGUMENTS'));

			const stopped = stopRepeat(message.target.id, id);
			if (!stopped) throw new ChatError($T('COMMANDS.REPEAT.NOT_FOUND', { id }));

			await removeRepeat(message.target.id, id);
			message.reply($T('COMMANDS.REPEAT.STOPPED', { id }));
		},
	},
	{
		name: 'repeats',
		help: 'Lists all active repeats in the room',
		syntax: 'CMD',
		perms: 'driver',
		categories: ['utility'],
		async run({ message, $T }) {
			const allRepeats = await fetchRoomRepeats(message.target.id);
			const roomRepeats = allRepeats.filter(r => r.room === message.target.id);

			if (!roomRepeats.length) return message.reply($T('COMMANDS.REPEAT.NO_REPEATS'));

			message.replyHTML(
				<div className="infobox">
					<h3>Active Repeats</h3>
					<hr />
					<table style={{ width: '100%', textAlign: 'left' }}>
						<thead>
							<tr>
								<th>ID</th>
								<th>Interval</th>
								<th>Set By</th>
								<th>Content</th>
							</tr>
						</thead>
						<tbody>
							{roomRepeats.map(r => (
								<tr key={r.id}>
									<td>
										<code>{r.id}</code>
									</td>
									<td>{toHumanTime(r.interval, 'f2s', $T)}</td>
									<td>
										<Username name={r.author} />
									</td>
									<td>
										<code>{r.content}</code>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			);
		},
	},
];
