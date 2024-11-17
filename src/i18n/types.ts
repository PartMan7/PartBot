import refText from '@/i18n/english';

export type Translations = typeof refText;

export type TextMap = {
	[key in keyof Translations as Translations[key] extends Record<string, string | string[]>
		? `${key}.${keyof Translations[key] & string}`
		: key]: string | string[];
};

export type TextLookup = keyof TextMap;

export type TranslationFn = (lookup: TextLookup, variables?: Record<string, string | number>) => string;
