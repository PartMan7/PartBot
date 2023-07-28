// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function emptyObject (obj: { [key: string]: any }): Record<string, never> {
	Object.keys(obj).forEach(key => delete obj[key]);
	return obj as Record<string, never>;
}
