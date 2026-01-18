import mongoose from 'mongoose';

import { IS_ENABLED } from '@/enabled';

import type { PSRepeat } from '@/types/ps';

const schema = new mongoose.Schema<PSRepeat>({
	room: { type: String, required: true },
	startedBy: { type: String, required: true },
	startedAt: { type: Number, required: true },
	id: { type: String, required: true },
	interval: { type: Number, required: true },
	author: { type: String, required: true },
	content: { type: String, required: true },
});

schema.index({ room: 1, id: 1 }, { unique: true });

const model = mongoose.model<PSRepeat>('repeat', schema, 'repeats', { overwriteModels: true });

export async function addRepeat(repeat: PSRepeat): Promise<boolean> {
	if (!IS_ENABLED.DB) return false;
	await model.create(repeat);
	return true;
}

export async function removeRepeat(room: string, id: string): Promise<boolean> {
	if (!IS_ENABLED.DB) return false;
	await model.deleteOne({ room, id });
	return true;
}

export async function fetchRoomRepeats(room: string): Promise<PSRepeat[]> {
	if (!IS_ENABLED.DB) return [];
	return model.find({ room }).lean();
}

export async function fetchRepeats(): Promise<PSRepeat[]> {
	if (!IS_ENABLED.DB) return [];
	return model.find({}).lean();
}
