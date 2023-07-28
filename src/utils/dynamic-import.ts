import * as path from 'path';

export default async function dynamicImport (text) {
	return await import(path.join(process.env.NODE_PATH, text + '.js'));
}
