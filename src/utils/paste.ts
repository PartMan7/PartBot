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
 * Uploads to part.cx. Returns null if no real access token is configured.
 */
export async function uploadToPartCx(text: string, filename = 'paste.txt'): Promise<string | null> {
	const token = process.env.PARTCX_ACCESS_TOKEN;
	if (!token || token === 'partf_example_key_here') return null;

	const body = new FormData();
	body.set('file', new Blob([text], { type: 'text/plain' }), filename);
	body.set('expiry', 'off');

	const res = await fetch('https://part.cx/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body });
	if (!res.ok) throw new Error(`part.cx upload failed: ${res.status}`);
	const { content } = (await res.json()) as { content: { url: string } };
	return content.url;
}

/**
 * Get _something_ uploaded.
 */
export async function upload(text: string): Promise<string> {
	try {
		return await uploadToPastie(text);
	} catch (err) {
		if (err instanceof Error) Logger.errorLog(err);
	}

	try {
		const partCx = await uploadToPartCx(text);
		if (partCx) return partCx;
	} catch (err) {
		if (err instanceof Error) Logger.errorLog(err);
	}

	const localPaste = await paste(text);
	if (!localPaste) throw new Error('Web is disabled!');
	return localPaste;
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
