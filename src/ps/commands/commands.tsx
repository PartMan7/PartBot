import { PSCommands } from '@/cache';
import { permissions } from '@/ps/handlers/commands/permissions';
import { getSpoofMessage } from '@/ps/handlers/commands/spoof';

import type { PSCommand } from '@/types/chat';
import { prefix } from '@/config/ps';

function titleCase(input: string): string {
	return input.charAt(0).toUpperCase() + input.slice(1);
}

export const command: PSCommand = {
	name: 'commands',
	help: 'Displays a list of commands that can be used by the user.',
	syntax: 'CMD [room?]',
	categories: ['utility'],
	async run({ message, arg }) {
		const targetRoom = arg ? message.parent.getRoom(arg) : message.type === 'chat' ? message.target : null;
		const allCommands = Object.values(PSCommands);

		const spoofedMessage =
			targetRoom && arg ? getSpoofMessage('', targetRoom.id, message.parent, { author: message.author }) : message;

		const visibleCommands = allCommands
			.filter(command => !command.flags?.noDisplay)
			.filter(command => {
				if (!command.perms) return true;
				if (permissions(command.perms, [command.name], spoofedMessage)) return true;
				return false;
			});

		const otherCommands: PSCommand[] = [];

		const groupedCommands = visibleCommands.reduce<Record<string, PSCommand[]>>(
			(grouped, command) => {
				if (command.categories.length > 0) {
					command.categories.forEach(category => (grouped[category] ??= []).push(command));
				} else {
					otherCommands.push(command);
				}
				return grouped;
			},
			{ utility: [], points: [], game: [], casual: [] }
		);

		message.author.sendHTML(
			<div className="infobox">
				<h2>Commands</h2>
				<p>
					Use <code>{prefix}help</code> for more details on an individual command.
				</p>
				<hr />
				{[
					...Object.entries(groupedCommands).map(([key, commands]) => [titleCase(key), commands] as [string, PSCommand[]]),
					['Other', otherCommands] as [string, PSCommand[]],
				]
					.filter(([_key, commands]) => commands.length > 0)
					.map(([key, commands]) => (
						<details>
							<summary style={{ marginBottom: 4 }}>{key} Commands</summary>
							{commands
								.sortBy(command => command.name)
								.map(command => <b title={command.help ?? undefined}>{command.name}</b>)
								.space(', ')}
						</details>
					))
					.space(<hr />)}
			</div>
		);
	},
};
