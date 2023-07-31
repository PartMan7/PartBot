import mongoose from 'mongoose';

const schema = new mongoose.Schema({
	id: {
		type: String,
		required: true,
		unique: true
	},
	from: {
		type: String,
		required: true
	},
	to: {
		type: String,
		required: true
	},
	at: {
		type: Date,
		required: true,
		default: Date.now
	}
});

schema.index({ id: 1 });
interface model {
	id: string;
	from: string;
	to: string;
	at: Date;
}
const model = mongoose.model('alt', schema, 'alts');

export async function alt (from: string, to: string): Promise<model> {
	const fromId = Tools.toId(from), toId = Tools.toId(to), id = `${fromId}-${toId}`;
	const entry = { id, from: fromId, to: toId, at: Date.now() };
	return model.findOneAndUpdate(entry, entry, { upsert: true, new: true });
}

export async function getAlts (user: string, limit: number = 50): Promise<string[]> {
	const userId = Tools.toId(user);
	const altsList = await model.find({ $or: [{ from: userId }, { to: userId }] }, null, limit ? { limit } : {});
	return altsList.map(doc => {
		return doc.from === userId ? doc.to : doc.from;
	});
}

export async function fetchAllAlts (): Promise<model[]> {
	return model.find({}).lean();
}
