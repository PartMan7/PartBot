import { evaluate } from 'utils/eval';

export const command: PSCommand = {
	name: 'eval',
	help: 'Evaluates code',
	syntax: 'CMD code',
	perms: 'admin',
	aliases: ['exec', 'run'],
	async run (message, context) {
		const { arg, originalCommand: [originalCommand] } = context;
		const res = await evaluate(arg, originalCommand === 'exec' ? 'ABBR_OUTPUT' : 'COLOR_OUTPUT', { message, context });
		if (originalCommand === 'eval') message.replyHTML(`<br/>${res.output}`); // Add a slight gap
		else if (originalCommand === 'run') message.sendHTML(res.output);
		else return message.reply(res.success ? `Command executed successfully` : `Error in executing command: ${res.output}`);
	}
};
