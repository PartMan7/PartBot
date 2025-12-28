import { uploadToPastie } from 'ps-client/tools';

import { PSPointsNonce, PSRoomConfigs } from '@/cache';
import { getAllUGOPoints } from '@/cache/ugo';
import {
	type BulkPointsDataInput,
	type Model as PointsModel,
	bulkAddPoints,
	getPoints,
	getRank,
	queryPoints,
	resetPoints,
} from '@/database/points';
import { IS_ENABLED } from '@/enabled';
import { renderUGOBoardGamesLeaderboard } from '@/ps/commands/games/other';
import { LB_COMMON_STYLES as COMMON_STYLES, LB_STYLES } from '@/ps/other/leaderboardStyles';
import { ChatError } from '@/utils/chatError';
import { Logger } from '@/utils/logger';
import { pluralize } from '@/utils/pluralize';
import { toId } from '@/utils/toId';

import type { TranslatedText } from '@/i18n/types';
import type { PSCommand } from '@/types/chat';
import type { PSPointsType, PSRoomConfig } from '@/types/ps';
import type { CSSProperties, ReactElement } from 'react';

const NUM_PATTERN = /^-?\d+$/;

function getPointsType(input: string, roomPoints: NonNullable<PSRoomConfig['points']>): PSPointsType[] | null {
	const pointsId = toId(input);
	if (pointsId === 'all') return Object.values(roomPoints.types);
	const res = Object.values(roomPoints.types).find(
		({ id, aliases, singular, plural, symbol }) =>
			id === pointsId || aliases?.includes(pointsId) || toId(singular) === pointsId || toId(plural) === pointsId || symbol === input
	);
	return res ? [res] : null;
}

export function Board({
	headers,
	data,
	asPage = false,
	style,
	styles = {},
}: {
	headers: (string | { hover: string; title: string })[];
	data: (string | number)[][];
	asPage?: boolean;
	style?: CSSProperties;
	styles?: { header?: CSSProperties; odd?: CSSProperties; even?: CSSProperties };
}): ReactElement {
	return (
		<div style={{ ...(!asPage ? { maxHeight: 320 } : undefined), overflowY: 'scroll' }}>
			<center>
				<table style={{ borderCollapse: 'collapse', borderSpacing: 0, borderColor: '#aaa', ...style }}>
					<colgroup>
						{/* widths: 40, 160, 150/remaining */}
						{headers.map((_title, index) => {
							// TODO: This can almost certainly be better. Probably revisit when we have flex.
							if (index === 0) return <col width={40} />;
							if (index === 1) return <col width={160} />;
							return <col width={150 / (headers.length - 2)} />;
						})}
					</colgroup>
					<thead>
						<tr>
							{headers.map(title => (
								<th style={{ ...COMMON_STYLES.header, ...styles.header }} title={typeof title !== 'string' ? title.hover : undefined}>
									{typeof title !== 'string' ? title.title : title}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{(data.length > 0 ? data : [headers.map(() => '-')]).map((row, rowIndex) => (
							<tr>
								{row.map(cell => (
									<td
										style={{
											...COMMON_STYLES.row,
											...(rowIndex % 2 === 1 ? { ...COMMON_STYLES.odd, ...styles.odd } : { ...COMMON_STYLES.even, ...styles.even }),
										}}
									>
										{cell}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</center>
		</div>
	);
}

export const command: PSCommand[] = [
	{
		name: 'addpoints',
		help: 'Adds points to a user!',
		syntax: 'CMD [points], [...users]',
		perms: Symbol.for('points.manage'),
		aliases: ['addp', 'add', 'removep', 'remove', 'removepoints'],
		categories: ['points'],
		async run(ctx) {
			const { message, arg, $T, originalCommand, broadcast } = ctx;
			if (!IS_ENABLED.DB) throw new ChatError($T('DISABLED.DB'));
			const roomConfig = PSRoomConfigs[message.target.id];
			if (!roomConfig?.points) throw new ChatError($T('COMMANDS.POINTS.ROOM_NO_POINTS', { room: message.target.title }));

			const args = arg.split(',').map(term => term.trim());
			// If command is not explicitly 'add' or 'remove', use the first declared points type
			const pointsTypeInput = ['add', 'remove'].includes(originalCommand.join('.')) ? args.shift() : roomConfig.points.priority[0];
			if (!pointsTypeInput) throw new ChatError($T('COMMANDS.POINTS.SPECIFY_TYPE'));

			const pointsTypes = getPointsType(pointsTypeInput, roomConfig.points);
			if (!pointsTypes) throw new ChatError($T('COMMANDS.POINTS.TYPE_NOT_FOUND', { type: pointsTypeInput }));

			const numVals = args.filter(arg => NUM_PATTERN.test(arg));
			if (numVals.length > 1) throw new ChatError($T('COMMANDS.POINTS.HOW_MANY', { values: numVals.join('/') }));
			const pointsAmount = (originalCommand.join('.').includes('remove') ? -1 : 1) * parseInt(numVals[0] ?? '1');
			if (Math.abs(pointsAmount) > 1e6) throw new ChatError($T('SCREW_YOU'));

			const users = args.filter(arg => !NUM_PATTERN.test(arg));
			if (users.length === 0) throw new ChatError($T('INVALID_ARGUMENTS'));

			const pointsData = Object.fromEntries(
				users.map(user => {
					const id = toId(user);
					return [id, { id, name: user, points: Object.fromEntries(pointsTypes.map(type => [type.id, pointsAmount])) }];
				})
			);
			const res = await bulkAddPoints(pointsData, message.target.id);
			if (!res) throw new ChatError($T('COMMANDS.POINTS.SOMETHING_WRONG'));

			const pluralData = {
				singular: pointsTypes.map(pointsType => pointsType.singular).join('/'),
				plural: pointsTypes.map(pointsType => pointsType.plural).join('/'),
			};
			broadcast(
				$T('COMMANDS.POINTS.ADDED_POINTS_TO_USERS', {
					pointsText: pluralize<TranslatedText>(pointsAmount, pluralData),
					users: users.list($T),
				})
			);
		},
	},
	// TODO: Use PSNonces
	{
		name: 'addnonce',
		help: null,
		syntax: 'CMD [nonce]',
		perms: 'driver',
		flags: { conceal: true, noDisplay: true, routePMs: true },
		categories: ['points'],
		async run({ message, $T, arg, broadcast }) {
			if (!IS_ENABLED.DB) throw new ChatError($T('DISABLED.DB'));

			const roomConfig = PSRoomConfigs[message.target.id];
			if (!roomConfig?.points) throw new ChatError($T('COMMANDS.POINTS.ROOM_NO_POINTS', { room: message.target.title }));

			const nonce = arg.trim();
			if (!nonce) throw new ChatError($T('COMMANDS.POINTS.NONCE_NOT_PROVIDED'));
			const data = PSPointsNonce[nonce];

			if (data === null) throw new ChatError($T('COMMANDS.POINTS.NONCE_ALREADY_USED', { nonce }));
			if (!data) throw new ChatError($T('COMMANDS.POINTS.NONCE_INVALID', { nonce }));

			const pointsData: BulkPointsDataInput = Object.fromEntries(
				Object.entries(data).map(([name, points]) => {
					const id = toId(name);
					return [id, { id, name, points }];
				})
			);

			PSPointsNonce[nonce] = null;
			try {
				await bulkAddPoints(pointsData, message.target.id);
			} catch (err) {
				PSPointsNonce[nonce] = data;
				throw err;
			}
			broadcast($T('COMMANDS.POINTS.ADDED'));
		},
	},
	{
		name: 'atm',
		help: "Displays a user's current points.",
		syntax: 'CMD [user?]',
		flags: { allowPMs: true },
		aliases: ['points'],
		categories: ['points'],
		async run({ message, $T, args, broadcast }) {
			if (!IS_ENABLED.DB) throw new ChatError($T('DISABLED.DB'));
			const room = message.parent.getRoom(message.type === 'chat' ? message.target.id : (args.shift() ?? ''));
			if (!room) throw new ChatError($T('INVALID_ROOM_ID'));
			const roomConfig = PSRoomConfigs[room.id];
			if (!roomConfig?.points) throw new ChatError($T('COMMANDS.POINTS.ROOM_NO_POINTS', { room: room.title }));
			const target = args.join(' ').trim() || message.author.id;
			const targetPoints = await getPoints(target, room.id);
			if (!targetPoints) throw new ChatError($T('COMMANDS.POINTS.USER_NO_POINTS', { user: target }));
			const roomPoints = roomConfig.points;
			return broadcast(
				$T('COMMANDS.POINTS.USER_POINTS', {
					user: targetPoints.name,
					roomName: room.title,
					pointsList: roomPoints.priority
						.map(type => pluralize<TranslatedText>(targetPoints.points[type], roomPoints.types[type]))
						.list($T),
				})
			);
		},
	},
	{
		name: 'rank',
		help: "Displays a user's rank on the leaderboard.",
		syntax: 'CMD [user?]',
		flags: { allowPMs: true },
		categories: ['points'],
		async run({ message, $T, args, broadcast }) {
			if (!IS_ENABLED.DB) throw new ChatError($T('DISABLED.DB'));
			const room = message.parent.getRoom(message.type === 'chat' ? message.target.id : (args.shift() ?? ''));
			if (!room) throw new ChatError($T('INVALID_ROOM_ID'));
			const roomConfig = PSRoomConfigs[room.id];
			if (!roomConfig?.points) throw new ChatError($T('COMMANDS.POINTS.ROOM_NO_POINTS', { room: room.title }));
			const roomPoints = roomConfig.points;
			const target = args.join(' ').trim() || message.author.id;
			const targetPoints = await getRank(target, room.id, roomPoints.priority);
			if (!targetPoints) throw new ChatError($T('COMMANDS.POINTS.USER_NO_POINTS', { user: target }));
			return broadcast(
				$T('COMMANDS.POINTS.USER_POINTS_RANKED', {
					user: targetPoints.name,
					rank: targetPoints.rank,
					roomName: room.title,
					pointsList: roomPoints.priority
						.map(type => pluralize<TranslatedText>(targetPoints.points[type], roomPoints.types[type]))
						.list($T),
				})
			);
		},
	},
	{
		name: 'leaderboard',
		help: 'Shows the leaderboard!',
		syntax: 'CMD [cap/priority]',
		flags: { allowPMs: true },
		aliases: ['lb'],
		categories: ['points'],
		async run({ message, $T, args, broadcastHTML }) {
			// UGO-CODE
			if (['boardgames', 'ugo'].includes(message.target.roomid)) {
				// Overload for Board Games
				const data = getAllUGOPoints();
				message.author.pageHTML(renderUGOBoardGamesLeaderboard(data, $T), { name: 'ugo' });
				return;
			}
			if (!IS_ENABLED.DB) throw new ChatError($T('DISABLED.DB'));
			// TODO: Maybe have some helper function to parse room name if not given
			const room = message.parent.getRoom(message.type === 'chat' ? message.target.id : (args.shift() ?? ''));
			if (!room) throw new ChatError($T('INVALID_ROOM_ID'));
			const roomConfig = PSRoomConfigs[room.id];
			if (!roomConfig?.points) throw new ChatError($T('COMMANDS.POINTS.ROOM_NO_POINTS', { room: room.title }));
			const roomPoints = roomConfig.points;

			let queryData: PointsModel[] | undefined;
			const arg = args.join('').trim();

			let pointsList = roomPoints.priority;
			if (NUM_PATTERN.test(arg)) queryData = await queryPoints(room.id, roomPoints.priority, +arg);
			else if (toId(arg) === 'all') queryData = await queryPoints(room.id, roomPoints.priority, Infinity);
			else if (arg) {
				const sortBy = getPointsType(arg, roomPoints)?.[0].id;
				if (!sortBy) throw new ChatError($T('INVALID_ARGUMENTS'));
				pointsList = [sortBy, ...roomPoints.priority.filter(type => type !== sortBy)];
				queryData = await queryPoints(room.id, pointsList);
			} else queryData = await queryPoints(room.id, roomPoints.priority, 10);

			if (!queryData) throw new Error(`Somehow I didn't manage to get any data! Send help please (${room.id}, ${args})`);

			const headers = [
				'#',
				$T('COMMANDS.POINTS.HEADERS.USER'),
				...pointsList.map(pointsType => ({
					hover: roomPoints.types[pointsType].plural,
					title: roomPoints.types[pointsType].symbol,
				})),
			];
			const data = queryData.map((user, index, data) => {
				let rank = index;

				const getPointsKey = (points: PointsModel['points']): string => pointsList.map(pointsType => points[pointsType]).join(',');
				const userPointsKey = getPointsKey(user.points);

				while (rank > 0) {
					const prev = data[rank - 1];
					if (getPointsKey(prev.points) !== userPointsKey) break;
					rank--;
				}

				return [rank + 1, user.name, ...pointsList.map(pointsType => user.points[pointsType])];
			});

			const roomStyles = LB_STYLES[roomConfig.points.format] ?? {};
			broadcastHTML(<Board headers={headers} data={data} styles={roomStyles} />);
		},
	},
	{
		name: 'resetleaderboard',
		help: 'Resets the leaderboard (either of a specific type, or all)',
		syntax: 'CMD [pointsType?]',
		perms: ['room', 'owner'],
		aliases: ['resetlb', 'leaderboardreset', 'lbreset', 'reset'],
		categories: ['points'],
		async run({ message, $T, arg, run }) {
			if (!IS_ENABLED.DB) throw new ChatError($T('DISABLED.DB'));
			const roomConfig = PSRoomConfigs[message.target.id];
			if (!roomConfig?.points) throw new ChatError($T('COMMANDS.POINTS.ROOM_NO_POINTS', { room: message.target.title }));
			const roomPoints = roomConfig.points;
			const pointsToReset = !arg || toId(arg) === 'all' ? true : getPointsType(arg, roomPoints);
			if (!pointsToReset) throw new ChatError($T('COMMANDS.POINTS.TYPE_NOT_FOUND', { type: arg }));

			message.privateReply($T('CONFIRM'));
			await message.target
				.waitFor(message => toId(message.content) === 'confirm')
				.catch(() => {
					throw new ChatError($T('NOT_CONFIRMED'));
				});

			const currentData = await queryPoints(message.target.id, roomPoints.priority, Infinity);
			if (currentData?.length) {
				const backupURL = await uploadToPastie(JSON.stringify(currentData, null, 2));
				Logger.log(`Backup for ${message.target.id}, reset ${pointsToReset} by ${message.author.id}: ${backupURL}`);
				message.target.send(`/modnote ${backupURL}`);
			}

			await resetPoints(message.target.id, typeof pointsToReset === 'boolean' ? pointsToReset : pointsToReset[0].id);
			if (pointsToReset === true) return message.reply($T('COMMANDS.POINTS.LB_RESET'));
			message.reply($T('COMMANDS.POINTS.TYPE_RESET', { type: pointsToReset[0].plural }));
			run('leaderboard');
		},
	},
];
