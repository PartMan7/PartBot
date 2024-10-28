import mongoose from 'mongoose';

// We don't really care about storing joins (since we can just use their 'online' status)
// Instead, we store the last time they were seen online; i.e. their leave time, not join

const schema = new mongoose.Schema({
	id: {
		type: String,
		required: true,
		unique: true,
	},
	at: {
		type: Date,
		required: true,
		default: Date.now,
	},
	in: {
		type: [String],
		required: true,
		default: [],
	},
});

schema.index({ id: 1 });
interface Model {
	id: string;
	at: Date;
	in: string[];
}
const model = mongoose.model('seen', schema, 'seens');

export function seeUser(user: string, rooms: string[] = []): Promise<Model> {
	const userId = Tools.toId(user);
	return model.findOneAndUpdate({ id: userId }, { id: userId, in: rooms }, { upsert: true, new: true });
}

export function lastSeen(user: string): Promise<Model | null> {
	const userId = Tools.toId(user);
	return model.findOne({ id: userId });
}

export function fetchAllSeens(): Promise<Model[]> {
	return model.find({}).lean();
}
