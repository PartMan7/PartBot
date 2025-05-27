import mongoose from 'mongoose';

import { PSRoomConfigs } from '@/cache';
import { IS_ENABLED } from '@/enabled';
import { toId } from '@/tools';

import type { AuthKey, PSRoomConfig } from '@/types/ps';

const schema = new mongoose.Schema<PSRoomConfig>({
	roomId: {
		type: String,
		required: true,
		unique: true,
	},
	roomName: String,
	auth: Object,
	tour: {
		timer: {
			type: [Number],
		},
	},
	whitelist: [String],
	blacklist: [String],
	aliases: [String],
	private: Boolean,
	ignore: Boolean,
	permissions: Object,

	points: {
		types: {
			type: Map,
			of: {
				id: { type: String, required: true },
				singular: { type: String, required: true },
				plural: { type: String, required: true },
				symbol: { type: String, required: true },
			},
			required: true,
		},
		pointsPriority: {
			type: [String],
			required: true,
		},
		format: String,
	},
	_assign: Object,
});

const model = mongoose.model<PSRoomConfig>('psroom', schema, 'psrooms', { overwriteModels: true });

export async function updateAuth(users: string[], authKey: AuthKey, roomId: string): Promise<boolean> {
	if (!IS_ENABLED.DB) return false;
	const roomConfig = (await model.findOne({ roomId })) ?? (await model.create({ roomId }));
	roomConfig.auth ??= {};
	for (const user of users) {
		const userId = toId(user);
		if (roomConfig.auth[authKey]?.includes(userId)) continue;
		for (const key in roomConfig.auth) {
			const list = roomConfig.auth[key as AuthKey];
			if (list?.includes(userId)) list.remove(userId);
		}
		roomConfig.auth[authKey] ??= [];
		roomConfig.auth[authKey].push(userId);
	}
	roomConfig.markModified('auth');
	await roomConfig.save();
	PSRoomConfigs[roomId] = roomConfig.toObject();
	return true;
}

export async function deauth(users: string[], roomId: string): Promise<boolean> {
	if (!IS_ENABLED.DB) return false;
	const roomConfig = (await model.findOne({ roomId })) ?? (await model.create({ roomId }));
	roomConfig.auth ??= {};
	for (const user of users) {
		const userId = toId(user);
		for (const key in roomConfig.auth) {
			const list = roomConfig.auth[key as AuthKey];
			if (list?.includes(userId)) list.remove(userId);
		}
	}
	roomConfig.markModified('auth');
	await roomConfig.save();
	PSRoomConfigs[roomId] = roomConfig.toObject();
	return true;
}

export async function getRoomConfig(roomId: string): Promise<PSRoomConfig | null> {
	if (!IS_ENABLED.DB) return null;
	return model.findOne({ roomId }).lean();
}

export async function fetchRoomConfigs(): Promise<PSRoomConfig[]> {
	if (!IS_ENABLED.DB) return [];
	return model.find({}).lean();
}
