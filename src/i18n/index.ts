import English from '@/i18n/english';
import Hindi from '@/i18n/hindi';
import { ChatError } from '@/utils/chatError';

import type { TextEntries, TranslationFn } from '@/i18n/types';

export const LanguageMap = {
	english: English,
	hindi: Hindi,
};

export function applyVariables(text: string, variables: Record<string, string | number>): string {
	return Object.entries(variables).reduce((acc, [name, value]) => acc.replaceAll(`{{${name}}}`, value.toString()), text);
}

export function i18n(language: keyof typeof LanguageMap = 'english'): TranslationFn {
	const translations = LanguageMap[language];
	const fallback = LanguageMap['english'];
	return (lookup, variables = {}) => {
		const [l1, l2] = lookup.split('.') as TextEntries[string];
		const base: string | string[] | undefined = l2
			? // @ts-expect-error -- Easier to fallback
				(translations[l1]?.[l2] ?? fallback[l1]?.[l2])
			: (translations[l1] ?? fallback[l1]);
		if (!base) throw new ChatError('Translations not found!');
		if (Array.isArray(base)) return applyVariables(base.random(), variables);
		return applyVariables(base, variables);
	};
}
