export class Timer {
	startTime: number;
	endTime: number;
	comment?: string;

	_node: NodeJS.Timeout;
	_callback: () => void;

	constructor (callback: () => void, time: number, comment?: string) {
		this._node = setTimeout(callback, time);
		this.startTime = Date.now();
		this.endTime = this.startTime + time;
		if (comment) this.comment = comment;

		this._callback = callback;
	}
	cancel () {
		clearTimeout(this._node);
	}
	execute () {
		this._callback();
		this.cancel();
	}
}
