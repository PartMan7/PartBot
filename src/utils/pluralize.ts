export function pluralize<T extends string>(count: number, info: { singular: string; plural: string }): T;
export function pluralize<T extends string = string>(count: number, singular: string, plural: string): T;
export function pluralize<T extends string = string>(
	count: number,
	arg2: string | { singular: string; plural: string },
	arg3?: string
): T {
	const singular = typeof arg2 === 'string' ? arg2 : arg2.singular;
	const plural = typeof arg3 === 'string' ? arg3 : typeof arg2 === 'string' ? arg3 : arg2.plural;
	return (count === 1 ? `${count} ${singular}` : `${count} ${plural}`) as T;
}
