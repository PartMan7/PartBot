import path from 'path';

export function fsPath(...paths: string[]): string {
	return path.join(__dirname, '..', ...paths);
}
