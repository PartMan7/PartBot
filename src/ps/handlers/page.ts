export default function pageHandler(message: PSMessage) {
	// Do stuff
	if (message.isIntro || !message.author.userid || !message.target) return;
	if (message.type !== 'pm') return;
	if (!message.content.startsWith('|requestpage|')) return;
}
