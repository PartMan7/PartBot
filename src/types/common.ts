type BaseRecursiveArray<T> = T | BaseRecursiveArray<T>[];

export type RecursiveArray<T> = BaseRecursiveArray<T>[];
