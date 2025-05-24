export interface EmitterEvents {
	trigger: [label: string, file: string];
	start: [label: string, files: string[]];
	complete: [label: string, files: string[]];
	error: [error: Error, label: string, files: string[]];
}

export type Register = { label: string; pattern: RegExp; reload: (filepaths: string[]) => Promise<void> | void; debounce?: number };
export type Listener = { label: string; pattern: RegExp; reload: (filepaths: string) => Promise<void> | void };
