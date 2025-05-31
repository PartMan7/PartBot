export class DeferredPromise<T = null, E = Error> {
	resolve: (value: T) => void = () => {};
	reject: (error: E) => void = () => {};
	promise: Promise<T>;
	constructor() {
		this.promise = new Promise<T>((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
		});
	}
}
