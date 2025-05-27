import mongoose from 'mongoose';

import { IS_ENABLED } from '@/enabled';
import { toId } from '@/tools';

interface Model {
	id: string;
	from: string;
	to: string;
	at: Date;
}

const schema = new mongoose.Schema<Model>({
	id: {
		type: String,
		required: true,
		unique: true,
	},
	from: {
		type: String,
		required: true,
	},
	to: {
		type: String,
		required: true,
	},
	at: {
		type: Date,
		required: true,
		default: Date.now,
	},
});

const model = mongoose.model<Model>('alt', schema, 'alts', { overwriteModels: true });

const DEFAULT_ALTS_CAP = 50;

export async function rename(from: string, to: string): Promise<Model | undefined> {
	if (!IS_ENABLED.DB) return;
	const userFromId = toId(from),
		userToId = toId(to),
		id = `${userFromId}-${userToId}`;
	if (userFromId === userToId) return;
	const entry = { id, from: userFromId, to: userToId, at: Date.now() };
	return model.findOneAndUpdate({ id }, entry, { upsert: true, new: true });
}

export async function getAlts(user: string, limit: number = DEFAULT_ALTS_CAP): Promise<string[]> {
	if (!IS_ENABLED.DB) return [];
	const userId = toId(user);
	const altsList = await model.find({ $or: [{ from: userId }, { to: userId }] }, null, limit ? { limit } : {});
	return altsList
		.map(doc => {
			return doc.from === userId ? doc.to : doc.from;
		})
		.unique();
}

export async function fetchAllAlts(): Promise<Model[]> {
	if (!IS_ENABLED.DB) return [];
	return model.find({}).maxTimeMS(30_000).lean();
}
