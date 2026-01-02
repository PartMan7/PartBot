import mongoose from 'mongoose';

import { IS_ENABLED } from '@/enabled';
import { toId } from '@/utils/toId';

export function quoteToTerms(quote: string): string {
	return quote
		.toLowerCase()
		.replace(/[^a-zA-Z0-9]+/g, ' ')
		.trim();
}

const schema = new mongoose.Schema({
	quote: {
		type: String,
		required: true,
	},
	rawText: {
		type: String,
		required: true,
		default: function (this: Model) {
			return quoteToTerms(this.quote);
		},
	},
	room: {
		type: String,
		required: true,
	},
	addedBy: {
		type: String,
		required: true,
	},
	addedById: {
		type: String,
		required: true,
		default: function (this: Model) {
			return toId(this.addedBy);
		},
	},
	at: {
		type: Date,
		required: true,
		default: Date.now,
	},
});

export interface Model {
	quote: string;
	rawText: string;
	room: string;
	addedBy: string;
	addedById: string;
	at: Date;
}
const model = mongoose.model('quote', schema, 'quotes', { overwriteModels: true });

export async function addQuote(quote: string, room: string, by: string): Promise<Model | null> {
	if (!IS_ENABLED.DB) return null;
	return model.create({ quote, room, addedBy: by });
}

export async function getAllQuotes(room: string): Promise<Model[]> {
	if (!IS_ENABLED.DB) return [];
	return (await model.find({ room }).sort({ at: 1 }).lean()) ?? [];
}

export async function getQuoteByIndex(index: number, room: string): Promise<Model | null> {
	if (!IS_ENABLED.DB) return null;
	const quotes = await getAllQuotes(room);
	return quotes[index] ?? null;
}

export async function deleteQuoteByIndex(index: number, quote: Model, room: string): Promise<Model | null> {
	if (!IS_ENABLED.DB) return null;

	const allQuotes = await model.find({ room }).sort({ at: 1 });
	if (index >= allQuotes.length) return null;
	const toDelete = allQuotes[index]!;
	if (toDelete.quote !== quote.quote) throw new Error(`Quote mismatch! Try again, probably. ${toDelete.quote} !== ${quote.quote}`);
	await toDelete.deleteOne();
	return toDelete.toObject();
}

export async function searchQuotes(
	room: string,
	filter: Partial<Omit<Model, 'room' | 'quote' | 'rawText'>> & {
		quote?: RegExp;
	}
): Promise<Model[]> {
	if (!IS_ENABLED.DB) return [];
	return model
		.find({ room, ...filter, quote: undefined, rawText: filter.quote })
		.sort({ at: 1 })
		.lean();
}
