import * as path from 'path';

export default function fsPath(...paths: string[]): string {
	return path.join(__dirname, '..', ...paths);
}
