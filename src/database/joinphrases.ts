import mongoose from 'mongoose';

import { IS_ENABLED } from '@/enabled';
import { toId } from '@/utils/toId';

interface Model {
	id: string; // * Unique field of form "userId-roomId"
	username: string;
	userId: string;
	roomId: string;
	phrase: string;
	addedBy: string;
	at: Date;
}

const schema = new mongoose.Schema<Model>({
	id: {
		type: String,
		required: true,
		unique: true,
	},
	username: {
		type: String,
		required: true,
	},
	userId: {
		type: String,
		default: ({ username }: Model) => toId(username),
	},
	roomId: {
		type: String,
		required: true,
	},
	phrase: {
		type: String,
		default: '',
	},
	addedBy: {
		type: String,
		required: true,
	},
	at: {
		type: Date,
		default: Date.now,
	},
});

const model = mongoose.model<Model>('joinphrase', schema, 'joinphrases', { overwriteModels: true });

export async function setJoinphrase(username: string, roomId: string, phrase: string, by: string): Promise<Model | null> {
	if (!IS_ENABLED.DB) return null;
	const userId = toId(username);
	return model.findOneAndUpdate(
		{
			id: `${userId}-${roomId}`,
			username,
			userId,
			roomId,
			phrase,
			addedBy: by,
		},
		{ upsert: true, new: true }
	);
}

export async function getJoinphrase(username: string, roomId: string): Promise<{ phrase: string } | null> {
	if (!IS_ENABLED.DB) return null;

	const id = `${toId(username)}-${roomId}`;
	return await model.findOne({ id }, { phrase: 1, _id: 0 }).lean();
}

export async function fetchAllJoinphrases(roomId: string | null): Promise<Model[]> {
	if (!IS_ENABLED.DB) return [];
	return model.find(roomId ? { roomId } : {}).lean();
}

export async function deleteJoinphrase(username: string, roomId: string): Promise<Model | null> {
	if (!IS_ENABLED.DB) return null;

	const id = `${toId(username)}-${roomId}`;
	const toDelete = await model.findOne({ id });

	if (!toDelete) return null;
	await toDelete.deleteOne();
	return toDelete.toObject();
}
