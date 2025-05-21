/* eslint-disable no-console */

/**
 * Patch out React key warnings
 * @see https://github.com/facebook/react/issues/12567
 */
const baseConsoleError = console.error.bind(console);
const keyWarningPattern = 'Warning: Each child in a list should have a unique "key" prop.';

console.error = function (...args) {
	if (typeof args[0] === 'string' && args[0].startsWith(keyWarningPattern)) {
		return;
	}
	return baseConsoleError(...args);
};
