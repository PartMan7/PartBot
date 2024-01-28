import { prefix } from 'config/ps';

function Entry ({ name, children }) {
	return <li><b>{name}</b>: {children}</li>;
}

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
			async run ({ broadcastHTML }) {
				broadcastHTML(<ul>
					<Entry name="(term / index)">
						Displays a random quote with the specified search term / at the given index.
					</Entry>
					<Entry name="help [h]">
						Displays this message.
					</Entry>
					<Entry name="random [r]">
						Displays a random quote.
					</Entry>
					<Entry name="find [f]">
						Displays all quotes with the specified search term.
					</Entry>
					<Entry name="last [z]">
						Displays the latest quote added.
					</Entry>
					<Entry name="list [l]">
						Displays a list (up to 50 quotes per list). If given a number, specifically looks up that list.
					</Entry>
					<Entry name="page [g]">
						Sends the user an HTML page (up to 50 quotes per page).
					</Entry>
					<Entry name="number [n]">
						Displays the number of quotes in the room.
					</Entry>
					<Entry name="preview [p]">
						Displays a preview of the given quote (without actually adding it)
					</Entry>
					<Entry name="add [a]">
						Adds the given quote. <code>\n</code> works as a newline, and <code>/me</code> syntax can be
						formatted via wrapping the username in <code>[]</code> (eg: <code>[14:20:21] • #PartMan hugs
						Hydro</code> would be formatted as <code>[14:20:21] • #[PartMan] hugs Hydro</code>) (staff-only)
					</Entry>
					<Entry name="delete [d/x]">
						Deletes the given quote. Accepts either an index or a lookup term (<code>z</code> deletes the last)
					</Entry>
					<Entry name="room [m]">
						Runs the command in the context of the given room. Eg: <code>{prefix}quote room Bot Development
						| list</code>
					</Entry>
				</ul>);
			}
		}
	},
	async run ({ run }) {
		return run('quote random');
	}
};
