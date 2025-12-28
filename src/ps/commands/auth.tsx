import { PSRoomConfigs } from '@/cache';
import { deauth, updateAuth } from '@/database/psrooms';
import { IS_ENABLED } from '@/enabled';
import { ChatError } from '@/utils/chatError';
import { Username } from '@/utils/components';
import { toId } from '@/utils/toId';

import type { PSCommand } from '@/types/chat';
import type { Perms } from '@/types/perms';

type PromotableAuthKey = 'whitelist' | 'voice' | 'driver' | 'mod';
type AuthValue = { alias: string[]; perms: Perms };

const ranksMapping: Record<PromotableAuthKey, AuthValue> = {
	whitelist: {
		alias: ['whitelist', 'wl'],
		perms: 'driver',
	},
	voice: {
		alias: ['voice'],
		perms: 'driver',
	},
	driver: {
		alias: ['driver', 'vroom'],
		perms: 'mod',
	},
	mod: {
		alias: ['moderator', 'mod'],
		perms: 'owner',
	},
};

export const command: PSCommand[] = IS_ENABLED.DB
	? [
			{
				name: 'promote',
				help: 'Promotes a user internally. Internal ranks affect PartBot commands and have no effect on PS.',
				syntax: 'CMD [rank], [users...]',
				categories: ['utility'],
				extendedAliases: {
					...Object.fromEntries(
						(Object.entries(ranksMapping) as [PromotableAuthKey, AuthValue][]).flatMap(([rank, { alias: aliases }]) =>
							aliases.map<[string, string[]]>(alias => [alias, ['promote', rank]])
						)
					),
					apl: ['promote', 'whitelist', 'list'],
				},
				async run({ run }) {
					return run('help promote');
				},
				children: Object.fromEntries(
					(Object.entries(ranksMapping) as [PromotableAuthKey, AuthValue][]).map<[string, PSCommand]>(([rank, { perms }]) => [
						rank,
						{
							name: rank,
							help: `Promotes user(s) to ${rank}.`,
							syntax: 'CMD [users...]',
							perms,
							categories: ['utility'],
							children: {
								list: {
									name: 'list',
									help: 'Lists the current users at the given rank.',
									perms: 'regular',
									syntax: 'CMD',
									async run({ message, broadcastHTML }) {
										const roomConfig = PSRoomConfigs[message.target.id];
										if (!roomConfig?.auth?.[rank]) return broadcastHTML(<>None at that rank!</>);
										return broadcastHTML(<>{roomConfig.auth[rank].map(user => <Username name={user} />).space(', ')}</>);
									},
								},
								add: {
									name: 'add',
									help: `Promotes user(s) to ${rank}.`,
									syntax: 'CMD [users...]',
									async run({ message, arg, checkPermissions, $T }) {
										const userList = arg.split(',');
										const users = userList.map(toId).filter(Boolean);
										if (!users.length) throw new ChatError($T('COMMANDS.AUTH.WHO_TO_PROMOTE'));
										const roomConfig = PSRoomConfigs[message.target.id];
										if (roomConfig?.auth) {
											const authKeys = Object.keys(ranksMapping) as PromotableAuthKey[];
											const cannotChangeRank = users.filter(userId => {
												const isAlready = authKeys.find(authKey => roomConfig.auth![authKey]?.includes(userId));
												return isAlready && !checkPermissions(ranksMapping[isAlready]?.perms ?? 'admin');
											});
											if (cannotChangeRank.length > 0) {
												throw new ChatError($T('COMMANDS.AUTH.CANNOT_CHANGE_RANK', { users: cannotChangeRank.list($T) }));
											}
										}
										await updateAuth(users, rank, message.target.id);
										message.sendHTML(
											<>
												Promoted {userList.map(user => <Username name={user} />).space(', ')} to {rank}!
											</>
										);
									},
								},
								remove: {
									name: 'remove',
									help: '(Use deauth instead)',
									syntax: 'deauth [users...]',
									aliases: ['delete', 'yeet', 'demote'],
									async run({ message, $T }) {
										message.reply($T('COMMANDS.AUTH.USE_DEAUTH'));
									},
								},
							},
							async run({ run, arg }) {
								return run(`promote ${rank} add ${arg}`);
							},
						},
					])
				),
			},
			{
				name: 'deauth',
				help: 'Demotes a user.',
				syntax: 'CMD [users...]',
				categories: ['utility'],
				async run({ message, arg, checkPermissions, $T }) {
					const userList = arg.split(',');
					const users = userList.map(toId).filter(Boolean);
					if (!users.length) throw new ChatError($T('COMMANDS.AUTH.WHO_TO_DEMOTE'));
					const roomConfig = PSRoomConfigs[message.target.id];
					if (roomConfig?.auth) {
						const authKeys = Object.keys(ranksMapping) as PromotableAuthKey[];
						const cannotChangeRank = users.filter(userId => {
							const isAlready = authKeys.find(authKey => roomConfig.auth![authKey]?.includes(userId));
							return isAlready && !checkPermissions(ranksMapping[isAlready]?.perms ?? 'admin');
						});
						if (cannotChangeRank.length > 0) {
							throw new ChatError($T('COMMANDS.AUTH.CANNOT_DEMOTE', { users: cannotChangeRank.list($T) }));
						}
					}

					await deauth(users, message.target.id);
					message.sendHTML(<>Demoted {userList.map(user => <Username name={user} />).space(', ')}.</>);
				},
			},
		]
	: [];
