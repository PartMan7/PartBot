import type { TranslatedText } from '@/i18n/types';

export class ChatError extends Error {
	constructor(args: TranslatedText) {
		super(args);
		this.name = this.constructor.name;
	}
}
