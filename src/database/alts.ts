import mongoose from 'mongoose';

const schema = new mongoose.Schema({
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

schema.index({ id: 1 });
interface Model {
	id: string;
	from: string;
	to: string;
	at: Date;
}
const model = mongoose.model('alt', schema, 'alts');

const DEFAULT_ALTS_CAP = 50;

export async function rename(from: string, to: string): Promise<Model | undefined> {
	const fromId = Tools.toId(from),
		toId = Tools.toId(to),
		id = `${fromId}-${toId}`;
	if (fromId === toId) return;
	const entry = { id, from: fromId, to: toId, at: Date.now() };
	return model.findOneAndUpdate({ id }, entry, { upsert: true, new: true });
}

export async function getAlts(user: string, limit: number = DEFAULT_ALTS_CAP): Promise<string[]> {
	const userId = Tools.toId(user);
	const altsList = await model.find({ $or: [{ from: userId }, { to: userId }] }, null, limit ? { limit } : {});
	return altsList
		.map(doc => {
			return doc.from === userId ? doc.to : doc.from;
		})
		.unique();
}

export async function fetchAllAlts(): Promise<Model[]> {
	return model.find({}).maxTimeMS(30_000).lean();
}
