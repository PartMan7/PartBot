const DEFAULT_ERROR_MESSAGES: Record<number, string> = {
	401: 'Invalid input.',
	404: 'Page/resource not found.',
	501: 'An internal server error occurred.',
};

export class WebError extends Error {
	statusCode: number;

	/**
	 * @param {string} arg Error message
	 * @param {number} [code=401] Error code
	 */
	constructor(arg?: string, code?: number);
	/**
	 * @param {number} [code=401] Error code
	 */
	constructor(code: number);
	constructor(arg?: string | number, fallbackCode?: number) {
		const code = typeof arg === 'number' ? arg : (fallbackCode ?? 401);
		const message = typeof arg === 'string' ? arg : (DEFAULT_ERROR_MESSAGES[code] ?? DEFAULT_ERROR_MESSAGES[501]);
		super(message);
		this.name = this.constructor.name;
		this.statusCode = code;
	}
}
