import mongoose from 'mongoose';

import { PSRoomConfigs } from '@/cache';
import { IS_ENABLED } from '@/enabled';
import { toId } from '@/tools';

export type Model = { id: string; userId: string; name: string; roomId: string; points: Record<string, number> };
type MapModel = Omit<Model, 'points'> & { points: Map<string, number> };

const schema = new mongoose.Schema<MapModel>({
	id: {
		type: String,
		required: true,
		unique: true,
	},
	userId: {
		type: String,
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
	roomId: {
		type: String,
		required: true,
	},
	points: {
		type: Map,
		of: Number,
		required: true,
	},
});

export const model = mongoose.model<MapModel>('point', schema, 'points', { overwriteModels: true });

const DEFAULT_LB_USERS_CAP = 50;

export type BulkPointsDataInput = Record<string, { name?: string; id: string; points: Record<string, number> }>;

export async function addPoints(user: string, points: Record<string, number>, roomId: string): Promise<Model | undefined> {
	if (!IS_ENABLED.DB) return;
	const userId = toId(user);
	const id = `${roomId}-${userId}`;
	const roomConfig = PSRoomConfigs[roomId].points!;
	const document = (await model.findOne({ id })) ?? (await model.create({ id, userId, roomId, name: user, points: new Map() }));
	document.name = user;
	Object.keys(roomConfig.types).forEach(type => document.points.set(type, document.points.get(type) ?? 0));
	Object.entries(points).forEach(([type, count]) => document.points.set(type, (document.points.get(type) ?? 0) + count));
	await document.save();
	return document.toJSON();
}

export async function bulkAddPoints(bulkData: BulkPointsDataInput, roomId: string): Promise<boolean | undefined> {
	if (!IS_ENABLED.DB) return;
	const roomConfig = PSRoomConfigs[roomId].points!;

	const bulkQueries = Object.values(bulkData).map(({ id, name, points }) => ({
		updateOne: {
			filter: { id: `${roomId}-${id}` },
			update: {
				$setOnInsert: {
					id: `${roomId}-${id}`,
					roomId,
					userId: id,
					...Object.fromEntries(
						roomConfig.priority.filter(type => typeof points[type] !== 'number').map(type => [`points.${type}`, 0])
					),
				},
				$inc: Object.fromEntries(Object.entries(points).map(([type, amount]) => [`points.${type}`, amount])),
				$set: { name: name ?? id },
			},
			upsert: true,
		},
	}));

	const res = await model.bulkWrite(bulkQueries);
	return res.isOk();
}

export async function getPoints(user: string, roomId: string): Promise<Model | null | undefined> {
	if (!IS_ENABLED.DB) return;
	const userId = toId(user);
	const id = `${roomId}-${userId}`;
	return model.findOne({ id }).lean();
}

export async function queryPoints(roomId: string, order: string[], cap = DEFAULT_LB_USERS_CAP): Promise<Model[] | undefined> {
	if (!IS_ENABLED.DB) return;
	return model
		.find({ roomId })
		.sort(order.map(pointType => [`points.${pointType}`, 'desc'] as [string, 'desc']))
		.limit(cap)
		.lean();
}

export async function getRank(user: string, roomId: string, order: string[]): Promise<(Model & { rank: number }) | null | undefined> {
	if (!IS_ENABLED.DB) return;
	const currentPoints = await getPoints(user, roomId);
	if (!currentPoints) return null;

	const behindUsers = await model
		.find({ roomId })
		.sort(order.map(pointType => [`points.${pointType}`, 'desc'] as [string, 'desc']))
		.gt(`points.${order[0]}`, currentPoints.points[order[0]])
		.lean();
	return { ...currentPoints, rank: behindUsers.length + 1 };
}

export async function resetPoints(roomId: string, pointsType: string | true): Promise<void> {
	if (!IS_ENABLED.DB) return;

	if (pointsType === true) {
		await model.deleteMany({ roomId });
		return;
	}

	const users = await model.find({ roomId });
	users.forEach(user => user.points.set(pointsType, 0));

	await model.bulkSave(users);
}
