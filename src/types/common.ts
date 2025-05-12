type BaseRecursiveArray<T> = T | BaseRecursiveArray<T>[];

export type RecursiveArray<T> = BaseRecursiveArray<T>[];

export type RecursivePartial<T> = {
	[P in keyof T]?: T[P] extends (infer U)[] ? RecursivePartial<U>[] : T[P] extends object | undefined ? RecursivePartial<T[P]> : T[P];
};

export type Satisfies<A, B extends A> = B;

// Mongoose output as JSON
export type SerializedInstance<T extends object> = {
	[key in keyof T]: Exclude<T[key], undefined> extends Map<infer K extends string | number | symbol, infer V>
		? Record<K, V> | (T[key] extends undefined ? undefined : never)
		: Exclude<T[key], null | undefined> extends Date
			? string | (T[key] extends null ? null : never) | (T[key] extends undefined ? undefined : never)
			: T[key];
};
