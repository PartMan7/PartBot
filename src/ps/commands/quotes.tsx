import { prefix } from 'config/ps';

export const command: PSCommand = {
	name: 'quotes',
	aliases: ['q', 'quote'],
	help: null,
	syntax: 'CMD',
	children: {
		help: {
			name: 'help',
			aliases: ['h'],
			help: 'Remove the extra \'help\'...',
			syntax: 'CMD',
			async run (message, { broadcastHTML }) {
				broadcastHTML(<ul>
					<li>
						<b>(term / index)</b>:
						Displays a random quote with the specified search term / at the given index.
					</li>
					<li>
						<b>help [h]</b>:
						Displays this message.
					</li>
					<li>
						<b>random [r]</b>:
						Displays a random quote.
					</li>
					<li>
						<b>find [f]</b>:
						Displays all quotes with the specified search term.
					</li>
					<li>
						<b>last [z]</b>:
						Displays the latest quote added.
					</li>
					<li>
						<b>list [l]</b>:
						Displays a list (up to 50 quotes per list). If given a number, specifically looks up that list.
					</li>
					<li>
						<b>page [g]</b>:
						Sends the user an HTML page (up to 50 quotes per page).
					</li>
					<li>
						<b>number [n]</b>:
						Displays the number of quotes in the room.
					</li>
					<li>
						<b>preview [p]</b>:
						Displays a preview of the given quote (without actually adding it)
					</li>
					<li>
						<b>add [a]</b>:
						Adds the given quote. <code>\n</code> works as a newline, and <code>/me</code> syntax can be
						formatted via wrapping the username in <code>[]</code> (eg: <code>[14:20:21] • #PartMan hugs
						Hydro</code> would be formatted as <code>[14:20:21] • #[PartMan] hugs Hydro</code>) (staff-only)
					</li>
					<li>
						<b>delete [d/x]</b>:
						Deletes the given quote. Accepts either an index or a lookup term (<code>z</code> deletes the last)
					</li>
					<li>
						<b>room [m]</b>:
						Runs the command in the context of the given room. Eg: <code>{prefix}quote room Bot Development
						| list</code>
					</li>
				</ul>);
			}
		}
	},
	async run (message, { run }) {
		return run('quote random');
	}
};
