import type { Message, User } from 'types/ps';

export default function interfaceHandler (message: Message) {
	if (message.type === 'pm') {
		// Ignore page requests; the PS interface for this is horrible
		if (message.content.startsWith('|requestpage|')) return;
	}
}
