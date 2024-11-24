import mongoose from 'mongoose';

import { toId } from '@/tools';

const schema = new mongoose.Schema({
	quote: {
		type: String,
		required: true,
	},
	rawText: {
		type: String,
		required: true,
		default: function (this: Model) {
			return (this.quote as string)
				.toLowerCase()
				.replace(/[^a-zA-Z0-9]+/g, ' ')
				.trim();
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

interface Model {
	quote: string;
	rawText: string;
	room: string;
	addedBy: string;
	addedById: string;
	at: Date;
}
const model = mongoose.model('quote', schema, 'quotes');

export function addQuote(quote: string, room: string, by: string): Promise<Model> {
	return model.create({ quote, room, addedBy: by });
}

export function getAllQuotes(room: string): Promise<Model[]> {
	return model.find({ room }).sort({ at: 1 }).lean();
}

export async function getQuoteByIndex(index: number, room: string): Promise<Model | null> {
	const quotes = await getAllQuotes(room);
	return quotes[index] ?? null;
}

export function searchQuotes(
	room: string,
	filter: Partial<Omit<Model, 'room' | 'quote' | 'rawText'>> & {
		quote?: RegExp;
	}
): Promise<Model[]> {
	return model
		.find({ room, ...filter, quote: undefined, rawText: filter.quote })
		.sort({ at: 1 })
		.lean();
}
