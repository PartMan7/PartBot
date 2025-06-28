import English from '@/i18n/languages/english';
import Hindi from '@/i18n/languages/hindi';
import Portuguese from '@/i18n/languages/portuguese';
import { ChatError } from '@/utils/chatError';

import type { NoTranslate, TranslatedText, TranslationFn, TranslationGroup } from '@/i18n/types';

export const LanguageMap = {
	english: English,
	hindi: Hindi,
	portuguese: Portuguese,
};

export type Language = keyof typeof LanguageMap;

export function applyVariables(text: string, variables: Record<string, string | number | undefined>): TranslatedText {
	return Object.entries(variables).reduce(
		(acc, [name, value]) => (typeof value !== 'undefined' ? acc.replaceAll(`{{${name}}}`, value.toString()) : acc),
		text
	) as TranslatedText;
}

export function i18n(language: Language = 'english'): TranslationFn {
	const translations = LanguageMap[language] as TranslationGroup | undefined;
	const fallback = LanguageMap['english'] as TranslationGroup;
	return (lookup, variables = {}) => {
		const lookupPath = lookup.split('.');
		const base: string | string[] | undefined =
			// @ts-expect-error -- Not bothering to type this whole thing
			lookupPath.reduce((group, label) => group?.[label], translations) ??
			// @ts-expect-error -- Not bothering to type this whole thing
			lookupPath.reduce((group, label) => group?.[label], fallback);
		if (!base) throw new ChatError('Translations not found!' as NoTranslate);
		if (Array.isArray(base)) return applyVariables(base.random(), variables);
		return applyVariables(base, variables);
	};
}
