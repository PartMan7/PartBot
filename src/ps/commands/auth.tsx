import { PSRoomConfigs } from '@/cache';
import { deauth, updateAuth } from '@/database/psrooms';
import { IS_ENABLED } from '@/enabled';
import { toId } from '@/tools';
import { ChatError } from '@/utils/chatError';
import { Username } from '@/utils/components';

import type { ToTranslate } from '@/i18n/types';
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
				help: 'Promotes a user.',
				syntax: 'CMD [rank], [users...]',
				flags: {
					roomOnly: true,
				},
				category: ['utility'],
				extendedAliases: {
					...Object.fromEntries(
						(Object.entries(ranksMapping) as [PromotableAuthKey, AuthValue][]).flatMap(([rank, { alias: aliases }]) =>
							aliases.map<[string, string[]]>(alias => [alias, ['promote', rank]])
						)
					),
					apl: ['whitelist', 'list'],
				},
				async run({ run }) {
					return run('help promote');
				},
				children: Object.fromEntries(
					(Object.entries(ranksMapping) as [PromotableAuthKey, AuthValue][]).map<[string, PSCommand]>(([rank, { perms }]) => [
						rank,
						{
							name: rank,
							help: `Promotes user(s) to ${rank}`,
							syntax: 'CMD [users...]',
							perms,
							children: {
								list: {
									name: 'list',
									help: 'Lists the current users at the given rank.',
									syntax: 'CMD',
									async run({ message, broadcastHTML }) {
										const roomConfig = PSRoomConfigs[message.target.id];
										if (!roomConfig?.auth?.[rank]) return broadcastHTML(<>None at that rank!</>);
										return broadcastHTML(<>{roomConfig.auth[rank].map(user => <Username name={user} />).space(', ')}</>);
									},
								},
								add: {
									name: 'add',
									help: `Promotes user(s) to ${rank}`,
									syntax: 'CMD [users...]',
									async run({ message, arg, checkPermissions, $T }) {
										const userList = arg.split(',');
										const users = userList.map(toId).filter(Boolean);
										if (!users.length) throw new ChatError('Who do you want to promote?' as ToTranslate);
										const roomConfig = PSRoomConfigs[message.target.id];
										if (roomConfig?.auth) {
											const authKeys = Object.keys(ranksMapping) as PromotableAuthKey[];
											const cannotChangeRank = users.filter(userId => {
												const isAlready = authKeys.find(authKey => roomConfig.auth![authKey]?.includes(userId));
												return isAlready && !checkPermissions(ranksMapping[isAlready]?.perms ?? 'admin');
											});
											if (cannotChangeRank.length > 0) {
												throw new ChatError(`Cannot change rank for ${cannotChangeRank.list($T)}.` as ToTranslate);
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
				flags: {
					roomOnly: true,
				},
				category: ['utility'],
				async run({ message, arg, checkPermissions, $T }) {
					const userList = arg.split(',');
					const users = userList.map(toId).filter(Boolean);
					if (!users.length) throw new ChatError('Who do you want to promote?' as ToTranslate);
					const roomConfig = PSRoomConfigs[message.target.id];
					if (roomConfig?.auth) {
						const authKeys = Object.keys(ranksMapping) as PromotableAuthKey[];
						const cannotChangeRank = users.filter(userId => {
							const isAlready = authKeys.find(authKey => roomConfig.auth![authKey]?.includes(userId));
							return isAlready && !checkPermissions(ranksMapping[isAlready]?.perms ?? 'admin');
						});
						if (cannotChangeRank.length > 0) {
							throw new ChatError(`Cannot demote ${cannotChangeRank.list($T)}.` as ToTranslate);
						}
					}

					await deauth(users, message.target.id);
					message.sendHTML(<>Demoted {userList.map(user => <Username name={user} />).space(', ')}.</>);
				},
			},
		]
	: [];
