import { evaluate } from '@/utils/eval';
import { MAX_CHAT_HTML_LENGTH } from '@/ps/constants';

export const command: PSCommand = {
	name: 'eval',
	help: 'Evaluates code',
	syntax: 'CMD code',
	perms: 'admin',
	aliases: ['exec', 'run'],
	async run(context) {
		const {
			message,
			arg,
			originalCommand: [originalCommand],
		} = context;
		const res = await evaluate(arg, originalCommand === 'exec' ? 'ABBR_OUTPUT' : 'COLOR_OUTPUT', { message, context });
		if (originalCommand !== 'exec') {
			let outputHTML = res.output;
			if (outputHTML.length > MAX_CHAT_HTML_LENGTH) {
				const trimmedOutput = res.output.split(/(?<=<\/span>)|(?=<span)/);
				let currentLength = outputHTML.length;
				while (currentLength > MAX_CHAT_HTML_LENGTH) {
					currentLength -= trimmedOutput.at(-1).length;
					trimmedOutput.pop();
				}
				outputHTML = `${trimmedOutput.join('')} ...`;
			}
			const WrappedHTML = (
				<div
					style={{ overflow: 'auto', maxHeight: '40vh', marginTop: originalCommand === 'eval' ? '20px' : undefined }}
					dangerouslySetInnerHTML={{ __html: outputHTML }}
				/>
			);
			if (originalCommand === 'eval') message.replyHTML(WrappedHTML);
			else if (originalCommand === 'run') message.sendHTML(WrappedHTML);
		} else return message.reply(res.success ? `Command executed successfully.` : `Error in executing command: ${res.output}`);
	},
};
