export class ChatError extends Error {
	constructor(args) {
		super(args);
		this.name = this.constructor.name;
	}
}
