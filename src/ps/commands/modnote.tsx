import { HSL, formatText } from 'ps-client/tools';

import { isGlobalBot, prefix } from '@/config/ps';
import { ChatError } from '@/utils/chatError';
import { Button, Form } from '@/utils/components/ps';
import { toId } from '@/utils/toId';

import type { PSCommand } from '@/types/chat';

function isStaff(userString: string): boolean {
	return /^[%@*#]/.test(userString);
}

export const command: PSCommand = {
	name: 'modnote',
	help: 'Creates a modnote in chat.',
	syntax: 'CMD [room], [message]',
	aliases: ['mn'],
	flags: { pmOnly: true, allowPMs: true },
	categories: ['utility'],
	children: {
		open: {
			name: 'open',
			help: 'Opens the modchat UI.',
			syntax: 'CMD [room]',
			async run({ message, arg }) {
				const targetRoom = toId(arg);
				const nonGlobalPrefix = !isGlobalBot ? `/msgroom ${targetRoom},` : '';

				message.author.pageHTML(
					<center>
						<Form value={`${nonGlobalPrefix}/botmsg ${message.parent.status.userid},${prefix}modnote send ${targetRoom}, {msg}`}>
							<br />
							<br />
							<input name="msg" type="text" style={{ width: 500 }} />
							<br />
							<br />
							<input type="submit" value="Modnote" name="Modnote" />
						</Form>
					</center>,
					{ name: `modnote-${targetRoom}` }
				);
			},
		},
		send: {
			name: 'send',
			help: 'Sends a modnote to the given room.',
			syntax: 'CMD [room], [message]',
			async run({ arg, message, $T, run }) {
				const [target, content = 'Hi!'] = arg.lazySplit(/[,|]/, 1);
				const targetRoom = message.parent.getRoom(target);
				if (!targetRoom) throw new ChatError($T('INVALID_ROOM_ID'));
				const userInRoom = targetRoom.users.find(user => toId(user) === message.author.id);
				if (!userInRoom) throw new ChatError($T('NOT_IN_ROOM'));
				if (!isStaff(userInRoom)) throw new ChatError($T('ACCESS_DENIED'));

				const nonGlobalPrefix = !isGlobalBot ? `/msgroom ${targetRoom.id},` : '';
				const [h, s, l] = HSL(message.author.id).hsl;
				targetRoom.sendHTML(
					<div className="infobox">
						<div className="chat chatmessage-partbot" style={{ display: 'inline-block' }}>
							<small>[MODNOTE] </small>
							<strong style={{ color: `hsl(${h},${s}%,${l}%)` }}>
								<small>{userInRoom.charAt(0)}</small>
								<span className="username" data-roomgroup={userInRoom.charAt(0)} data-name={message.author.name}>
									{message.author.name}
								</span>
								:
							</strong>
							<em dangerouslySetInnerHTML={{ __html: formatText(content) }} />
						</div>
						<br />
						<span style={{ color: '#444', fontSize: 10 }}>
							Note: Only users ranked % and above can see this. Use{' '}
							<Button
								value={`${nonGlobalPrefix}/botmsg ${message.parent.status.userid},${prefix}modnote open ${targetRoom.id}`}
								style={{ background: '#8881', border: '1px dashed #666', borderRadius: 4, color: '#444' }}
							>
								<small>{prefix}modnote</small>
							</Button>{' '}
							to reply.
						</span>
					</div>,
					{ rank: '*' }
				);

				run(`modnote open ${targetRoom.id}`);
			},
		},
	},
	async run({ arg, message, run, $T }) {
		if (!arg) {
			const rooms = [
				...message.parent.rooms.values().filter(room => room.users.find(user => toId(user) === message.author.id && isStaff(user))),
			];
			if (!rooms.length) throw new ChatError($T('COMMANDS.MODNOTE.NO_COMMON_ROOMS'));
			if (rooms.length === 1) return run(`modnote open ${rooms[0].id}`);

			message.author.sendHTML(
				<>
					Which room?
					<br />
					{rooms
						.map(room => (
							<Button
								value={`${!isGlobalBot ? `/msgroom ${room.id},` : ''}/botmsg ${message.parent.status.userid},${prefix}modnote open ${room.id}`}
							>
								{room.title}
							</Button>
						))
						.space(' ')}
				</>
			);
			return;
		}
		return run(`modnote send ${arg}`);
	},
};
