import type refText from '@/i18n/english';

export type Translations = typeof refText;

export type TextEntries = {
	[key in keyof Translations as string]: Translations[key] extends Record<string, string | string[]>
		? [key, keyof Translations[key] & string]
		: [key];
};

export type TextMap = {
	[key in keyof Translations as Translations[key] extends Record<string, string | string[]>
		? `${key}.${keyof Translations[key] & string}`
		: key]: string | string[];
};

export type TranslationFn = (lookup: keyof TextMap, variables?: Record<string, string | number>) => string;
