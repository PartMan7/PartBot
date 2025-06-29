import type refText from '@/i18n/languages/english';
import type { Message, Room } from 'ps-client';

export type Translations = typeof refText;

// Like RecursivePartial, but loosens 'string' to string
type RecursiveLoosePartial<T> = {
	[P in keyof T]?: T[P] extends string | readonly string[]
		? string | readonly string[]
		: T[P] extends object
			? RecursiveLoosePartial<T[P]>
			: T[P];
};
export type AvailableTranslations = RecursiveLoosePartial<Translations>;

export type TranslationGroup = { [key: string]: string | readonly string[] | TranslationGroup };
type GetEntries<Group extends TranslationGroup> = {
	[key in Exclude<keyof Group, symbol | number> as Group[key] extends TranslationGroup
		? `${key}.${keyof GetEntries<Group[key]>}`
		: key]: string | string[];
};
export type TextMap = GetEntries<Translations>;

export type TranslatedText = string & { __translated: true };
// Use this type to indicate that some text does not need to be translated
export type NoTranslate = TranslatedText;
// Use this type to indicate that some text needs to be translated
export type ToTranslate = TranslatedText;

export type TranslationFn = (
	lookup: Exclude<keyof TextMap, number | symbol>,
	variables?: Record<string, string | number | undefined>
) => TranslatedText;

type ReplaceStringWithTranslatedText<TParams extends readonly unknown[]> = {
	[K in keyof TParams]: TParams[K] extends string ? TranslatedText : TParams[K];
};
type ForceTranslations<F> = F extends (...args: infer T) => infer R ? (...args: ReplaceStringWithTranslatedText<T>) => R : never;

type MessageReplyKeys = 'reply' | 'privateReply';
export type PSMessageTranslated = Omit<Message, MessageReplyKeys> & {
	[key in MessageReplyKeys]: ForceTranslations<Message[key]>;
};

type RoomSendKeys = 'send' | 'privateSend';
export type PSRoomTranslated = Omit<Room, RoomSendKeys> & {
	[key in RoomSendKeys]: ForceTranslations<Room[key]>;
};
