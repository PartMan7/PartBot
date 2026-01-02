import English from '@/i18n/languages/english';
import French from '@/i18n/languages/french';
import Hindi from '@/i18n/languages/hindi';
import Portuguese from '@/i18n/languages/portuguese';
import { ChatError } from '@/utils/chatError';

import type { NoTranslate, TranslatedText, TranslationFn } from '@/i18n/types';

export const LanguageMap = {
	english: English,
	hindi: Hindi,
	portuguese: Portuguese,
	french: French,
};

export type Language = keyof typeof LanguageMap;

function applyVariables(text: string, variables: Record<string, string | number | undefined>): TranslatedText {
	return Object.entries(variables).reduce(
		(acc, [name, value]) => (typeof value !== 'undefined' ? acc.replaceAll(`{{${name}}}`, value.toString()) : acc),
		text
	) as TranslatedText;
}

export function i18n(language: Language = 'english'): TranslationFn {
	const translations = LanguageMap[language];
	const fallback = LanguageMap['english'];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Not bothering to type this whole thing
	return (lookup, variables = {} as any) => {
		const lookupPath = lookup.split('.');
		const base =
			// @ts-expect-error -- Not bothering to type this whole thing
			lookupPath.reduce((group, label) => group?.[label], translations) ??
			// @ts-expect-error -- Not bothering to type this whole thing
			lookupPath.reduce((group, label) => group?.[label], fallback);
		if (typeof base === 'string') return applyVariables(base, variables);
		if (Array.isArray(base)) return applyVariables(base.random(), variables);
		throw new ChatError('Translations not found!' as NoTranslate);
	};
}
