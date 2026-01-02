import type refText from '@/i18n/languages/english';
import type { PSMessage } from '@/types/ps';
import type { Room } from 'ps-client';

export type BaseTranslations = typeof refText;

// Like RecursivePartial, but loosens 'string' to string
type RecursiveLoosePartial<T> = {
	[P in keyof T]?: T[P] extends string | readonly string[]
		? string | readonly string[]
		: T[P] extends object
			? RecursiveLoosePartial<T[P]>
			: T[P];
};
export type AvailableTranslations = RecursiveLoosePartial<BaseTranslations>;

type TranslationGroup = { [key: string]: string | readonly string[] | TranslationGroup };

type FlattenRefEntries<Group extends TranslationGroup, Prefix extends string = ''> = {
	[K in Exclude<keyof Group, symbol | number>]: Group[K] extends TranslationGroup
		? FlattenRefEntries<Group[K], `${Prefix}${K}.`>
		: { [P in `${Prefix}${K}`]: Group[K] };
}[Exclude<keyof Group, symbol | number>];
type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
type GetRefEntries<Group extends TranslationGroup> = UnionToIntersection<FlattenRefEntries<Group>>;
type FlattenTextOptions<Group extends Record<string, string | readonly string[]>> = {
	[K in keyof Group]: Group[K] extends string ? Group[K] : Group[K] extends readonly string[] ? Group[K][0] : never;
};
type RefTextMap = FlattenTextOptions<GetRefEntries<BaseTranslations>>;

export type TranslatedText = string & { __translated: true };
// Use this type to indicate that some text does not need to be translated
export type NoTranslate = TranslatedText;
// Use this type to indicate that some text needs to be translated
export type ToTranslate = TranslatedText;

type InferVariables<T extends string> = T extends `${infer Prefix}{{${infer Variable}}}${infer Suffix}`
	? InferVariables<Prefix> | Variable | InferVariables<Suffix>
	: never;
export type BaseLookup = Exclude<keyof RefTextMap, number | symbol>;
export type VariablesFromLookup<Lookup extends BaseLookup> = InferVariables<RefTextMap[Lookup]>;

export type TranslationFn = <Lookup extends BaseLookup>(
	lookup: Lookup,
	variables?: Record<VariablesFromLookup<Lookup>, string | number | undefined>
) => TranslatedText;

type ReplaceStringWithTranslatedText<TParams extends readonly unknown[]> = {
	[K in keyof TParams]: TParams[K] extends string ? TranslatedText : TParams[K];
};
type ForceTranslations<F> = F extends (...args: infer T) => infer R ? (...args: ReplaceStringWithTranslatedText<T>) => R : never;

type MessageReplyKeys = 'reply' | 'privateReply';
export type PSMessageTranslated = Omit<PSMessage, MessageReplyKeys> & {
	[key in MessageReplyKeys]: ForceTranslations<PSMessage[key]>;
};

type RoomSendKeys = 'send' | 'privateSend';
export type PSRoomTranslated = Omit<Room, RoomSendKeys> & {
	[key in RoomSendKeys]: ForceTranslations<Room[key]>;
};
