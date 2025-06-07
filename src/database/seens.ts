import mongoose from 'mongoose';

import { toId } from '@/tools';

// We don't really care about storing joins (since we can just use their 'online' status)
// Instead, we store the last time they were seen online; i.e. their leave time, not join

interface Model {
	id: string;
	at: Date;
	name: string;
	seenIn: string[];
}

const schema = new mongoose.Schema<Model>({
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
	name: {
		type: String,
		required: true,
	},
	seenIn: {
		type: [String],
		required: true,
		default: [],
	},
});

const model = mongoose.model<Model>('seen', schema, 'seens', { overwriteModels: true });

export function seeUser(user: string, rooms: string[] = [], at = new Date()): Promise<Model> {
	const userId = toId(user);
	return model.findOneAndUpdate({ id: userId }, { id: userId, name: user, seenIn: rooms, at }, { upsert: true, new: true });
}

export function lastSeen(user: string): Promise<Model | null> {
	const userId = toId(user);
	return model.findOne({ id: userId });
}

export function fetchAllSeens(): Promise<Model[]> {
	return model.find({}).lean();
}
