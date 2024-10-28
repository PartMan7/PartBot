export function debounce<T extends (...args: unknown[]) => unknown>(
	callback: T,
	debounceInterval: number
): (...args: Parameters<T>) => void {
	let debounceTimer: NodeJS.Timeout;
	return (...args) => {
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(callback, debounceInterval, ...args);
	};
}
