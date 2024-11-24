export class ChatError extends Error {
	constructor(args: string) {
		super(args);
		this.name = this.constructor.name;
	}
}
