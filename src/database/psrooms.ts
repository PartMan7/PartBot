import mongoose from 'mongoose';

import type { PSRoomConfig, UnparsedPSRoomConfig } from '@/types/ps';

const schema = new mongoose.Schema({
	roomId: {
		type: String,
		required: true,
		unique: true,
	},
	roomName: {
		type: String,
		required: true,
	},
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
		types: [
			{
				name: String,
				plur: String,
				symbol: {
					value: String,
					ascii: String,
				},
			},
		],
		render: {
			template: String,
			override: [String],
		},
		roomId: String,
	},
	_assign: Object,
});

const model = mongoose.model('psroom', schema, 'psrooms');

export function parseRoomConfig(config: UnparsedPSRoomConfig): PSRoomConfig {
	const newConfig: UnparsedPSRoomConfig = config;
	return {
		...newConfig,
		whitelist: newConfig.whitelist?.map(str => new RegExp(str)),
		blacklist: newConfig.blacklist?.map(str => new RegExp(str)),
	};
}

export async function getRoomConfig(roomId: string): Promise<PSRoomConfig | null> {
	const res = await model.findOne({ roomId }).lean() as UnparsedPSRoomConfig | null;
	if (!res) return null;
	return parseRoomConfig(res);
}

export async function fetchRoomConfigs(): Promise<PSRoomConfig[]> {
	const res = await model.find({}).lean() as UnparsedPSRoomConfig[];
	return res.map(parseRoomConfig);
}
