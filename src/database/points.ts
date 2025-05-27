import mongoose from 'mongoose';

import { IS_ENABLED } from '@/enabled';
import { toId } from '@/tools';

type Model = { id: string; userId: string; name: string; roomId: string; points: Record<string, number> };
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

const model = mongoose.model<MapModel>('point', schema, 'points', {
	overwriteModels: true,
});

const DEFAULT_LB_USERS_CAP = 50;

export async function addPoints(user: string, points: Record<string, number>, roomId: string): Promise<Model | undefined> {
	if (!IS_ENABLED.DB) return;
	const userId = toId(user);
	const id = `${roomId}-${userId}`;
	const document = (await model.findOne({ id })) ?? (await model.create({ id, userId, roomId, name: user, points: new Map() }));
	document.name = user;
	Object.entries(points).forEach(([type, count]) => document.points.set(type, (document.points.get(type) ?? 0) + count));
	await document.save();
	return document.toJSON();
}

export async function bulkAddPoints(
	bulkData: Record<string, { name?: string; id: string; points: Record<string, number> }>,
	roomId: string
): Promise<Model[] | undefined> {
	if (!IS_ENABLED.DB) return;
	const lookupIds = Object.keys(bulkData).map(userId => `${roomId}-${userId}`);
	const userPoints = await model.find({ id: { $in: lookupIds } });

	const documentsToSave = await Promise.all(
		Object.values(bulkData).map(async ({ name, id, points }) => {
			const existing = userPoints.find(document => document.userId === id);
			const document =
				existing ?? (await model.create({ id: `${roomId}-${id}`, userId: id, name: name ?? id, roomId, points: new Map() }));
			Object.entries(points).forEach(([type, count]) => document.points.set(type, (document.points.get(type) ?? 0) + count));
			return document;
		})
	);

	await model.bulkSave(documentsToSave);
	return userPoints.map(document => document.toJSON());
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

export async function getRank(user: string, roomId: string, order: string[]): Promise<number | null | undefined> {
	if (!IS_ENABLED.DB) return;
	const currentPoints = await getPoints(user, roomId);
	if (!currentPoints) return null;

	const behindUsers = await model
		.find({ roomId })
		.sort(order.map(pointType => [`points.${pointType}`, 'desc'] as [string, 'desc']))
		.gt(`points.${order[0]}`, currentPoints.points[order[0]])
		.lean();
	return behindUsers.length + 1;
}
