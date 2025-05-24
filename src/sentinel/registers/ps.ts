import { promises as fs } from 'fs';

import { reloadCommands } from '@/ps/loaders/commands';
import { LivePS } from '@/sentinel/live';
import { cachebuster } from '@/utils/cachebuster';
import { fsPath } from '@/utils/fsPath';

import type { Register } from '@/sentinel/types';

const PS_EVENT_HANDLERS = {
	'autores-handler': { imports: ['autoResHandler'], importPath: '@/ps/handlers/autores', fileName: 'autores' },
	'interface-handler': { imports: ['interfaceHandler'], importPath: '@/ps/handlers/interface', fileName: 'interface' },
	'joins-handler': { imports: ['joinHandler', 'leaveHandler', 'nickHandler'], importPath: '@/ps/handlers/joins', fileName: 'joins' },
	'page-handler': { imports: ['pageHandler'], importPath: '@/ps/handlers/page', fileName: 'page' },
	'raw-handler': { imports: ['rawHandler'], importPath: '@/ps/handlers/raw', fileName: 'raw' },
} satisfies Record<string, { imports: (keyof typeof LivePS)[]; importPath: string; fileName: string }>;

export const PS_REGISTERS: Register[] = [
	{
		label: 'commands',
		pattern: /\/ps\/commands\//,
		reload: async filepaths => {
			filepaths.forEach(cachebuster);
			return reloadCommands();
		},
	},

	{
		label: 'games',
		pattern: /\/ps\/games\//,
		reload: async filepaths => {
			['common', 'game', 'index', 'render'].forEach(file => cachebuster(`@/ps/games/${file}`));
			const games = filepaths.reduce<string[]>((acc, filepath) => {
				const match = filepath.match(/\/ps\/games\/([^/]*)\//);
				if (match) acc.push(match[1]);
				return acc;
			}, []);
			await Promise.all(
				games.map(async game => {
					const files = await fs.readdir(fsPath('ps', 'games', game));
					files.forEach(file => cachebuster(fsPath('ps', 'games', game, file)));
				})
			);
			// TODO: Regenerate games commands if needed
		},
	},

	{
		label: 'commands-handler',
		pattern: /\/ps\/handlers\/commands/,
		reload: async () => {
			await Promise.all(
				(<const>['parse', 'permissions', 'spoof']).map(async file => {
					const importPath = `@/ps/handlers/commands/${file}`;
					cachebuster(importPath);
					const hotHandler = await import(importPath);
					LivePS.commands[file] = hotHandler[file];
				})
			);

			cachebuster('@/ps/handlers/commands/customPerms');
			const { GROUPED_PERMS: newGroupedPerms } = await import('@/ps/handlers/commands/customPerms');
			LivePS.commands.GROUPED_PERMS = newGroupedPerms;

			cachebuster('@/ps/handlers/commands');
			const { commandHandler } = await import('@/ps/handlers/commands');
			LivePS.commands.commandHandler = commandHandler;
		},
	},

	// other, generic event handlers
	...Object.entries(PS_EVENT_HANDLERS).map(([label, handlerData]) => ({
		label,
		pattern: new RegExp(`\\/ps\\/handlers\\/${handlerData.fileName}`),
		reload: async () => {
			cachebuster(handlerData.importPath);
			const hotHandler = await import(handlerData.importPath);
			handlerData.imports.forEach(namedImport => (LivePS[namedImport] = hotHandler[namedImport]));
		},
	})),
];
