import { PSRoomConfigs } from '@/cache';
import { bulkAddPoints } from '@/database/points';
import { IS_ENABLED } from '@/enabled';
import { toId } from '@/tools';
import { ChatError } from '@/utils/chatError';
import { pluralize } from '@/utils/pluralize';

import type { ToTranslate, TranslatedText } from '@/i18n/types';
import type { PSCommand } from '@/types/chat';

const NUM_PATTERN = /^-?\d+$/;

export const command: PSCommand[] = [
	{
		name: 'addpoints',
		help: 'Adds points to a user!',
		syntax: 'CMD [points], [...users]',
		flags: { roomOnly: true },
		perms: Symbol.for('points.manage'),
		aliases: ['addp', 'add'],
		async run(ctx) {
			const { message, arg, $T, originalCommand, broadcast } = ctx;
			if (!IS_ENABLED.DB) throw new ChatError($T('DISABLED.DB'));
			const roomConfig = PSRoomConfigs[message.target.id];
			if (!roomConfig.points) throw new ChatError($T('COMMANDS.POINTS.ROOM_NO_POINTS', { room: message.target.title }));

			const args = arg.split(',').map(term => term.trim());
			const pointsTypeInput = originalCommand.join('.') === 'add' ? args.shift() : roomConfig.points.priority[0];
			if (!pointsTypeInput) throw new ChatError('Specify a points type!' as ToTranslate);
			const pointsId = toId(pointsTypeInput);
			const pointsType = Object.values(roomConfig.points.types).find(
				({ id, aliases, singular, plural, symbol }) =>
					id === pointsId ||
					aliases?.includes(pointsId) ||
					toId(singular) === pointsId ||
					toId(plural) === pointsId ||
					symbol === pointsTypeInput
			);
			if (!pointsType) throw new ChatError(`Couldn't find a points type matching ${pointsTypeInput}.` as ToTranslate);

			const numVals = args.filter(arg => NUM_PATTERN.test(arg));
			if (numVals.length !== 1) throw new ChatError(`How many points? ${numVals.join('/')}` as ToTranslate);
			const pointsAmount = parseInt(numVals[0]);
			if (Math.abs(pointsAmount) > 1e6) throw new ChatError($T('SCREW_YOU'));

			const users = args.filter(arg => !NUM_PATTERN.test(arg));
			if (users.length === 0) throw new ChatError($T('INVALID_ARGUMENTS'));

			const pointsData = Object.fromEntries(
				users.map(user => {
					const id = toId(user);
					return [id, { id, name: user, points: { [pointsType.id]: pointsAmount } }];
				})
			);
			const res = await bulkAddPoints(pointsData, message.target.id);
			if (!res) throw new ChatError('Something went wrong...' as ToTranslate);
			broadcast(
				`Added ${pluralize<TranslatedText>(pointsAmount, pointsType)} to ${res.map(entry => entry.name).list($T)}.` as ToTranslate
			);
		},
	},
];
