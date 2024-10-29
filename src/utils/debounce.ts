export function debounce<T extends (...args: unknown[][]) => unknown>(
	callback: T,
	debounceInterval: number
): (...args: Parameters<T>) => void {
	let debounceTimer: NodeJS.Timeout;
	let args: Parameters<T> | [] = [];
	return (...newArgs) => {
		args = newArgs.map((newArg, i) => [...(args[i] ?? []), ...newArg]) as Parameters<T>;
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			callback(...args);
			args = [];
		}, debounceInterval);
	};
}
