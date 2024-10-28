// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO get this working with 'unknown'
export default function emptyObject<T extends Record<string, any>>(obj: T): Record<string, never> {
	Object.keys(obj).forEach(key => delete obj[key]);
	return obj as Record<string, never>;
}
