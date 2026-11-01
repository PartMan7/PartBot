import fs from 'fs/promises';
import { uploadToPastie } from 'ps-client/tools';

import { usePersistedCache } from '@/cache/persisted';
import { IS_ENABLED } from '@/enabled';
import { fsPath } from '@/utils/fsPath';
import { Logger } from '@/utils/logger';

const pasteIdCache = usePersistedCache('pasteId');
function getNextPasteId(): string {
	const newId = pasteIdCache.get() + 1;
	pasteIdCache.set(newId);

	const idNum = (newId * 722222227) % 36 ** 6;
	return idNum.toString(36).padStart(6, '0');
}

/**
 * Get _something_ uploaded. TODO: part.cx integration.
 */
export async function upload(text: string): Promise<string> {
	try {
		return await uploadToPastie(text);
	} catch (err) {
		if (err instanceof Error) Logger.errorLog(err);
		const localPaste = await paste(text);
		if (!localPaste) throw new Error('Web is disabled!');
		return localPaste;
	}
}

/**
 * Uploads to the internal Paste system.
 */
export async function paste(text: string, slug: string | null = null): Promise<string | null> {
	if (!IS_ENABLED.WEB) return null;
	const id = slug ?? getNextPasteId();

	try {
		await fs.writeFile(fsPath('web', 'pastes', `${id}.txt`), text, { flag: 'wx' });
		return `${process.env.WEB_URL}/paste/${id}`;
	} catch {
		throw Error(`${id} is already taken as a Paste ID!`);
	}
}
