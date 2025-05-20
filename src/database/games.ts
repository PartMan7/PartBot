import mongoose, { type HydratedDocument } from 'mongoose';

import { IS_ENABLED } from '@/enabled';

import type { Player } from '@/ps/games/common';

const schema = new mongoose.Schema({
	id: {
		type: String,
		required: true,
		unique: true,
	},
	game: {
		type: String,
		required: true,
	},
	room: {
		type: String,
		required: true,
	},
	players: {
		type: Map,
		of: {
			name: {
				type: String,
				required: true,
			},
			id: {
				type: String,
				required: true,
			},
			turn: {
				type: String,
				required: true,
			},
		},
		required: true,
	},
	created: {
		type: Date,
		required: true,
	},
	started: {
		type: Date,
		required: true,
	},
	ended: {
		type: Date,
		required: true,
		default: Date.now,
	},
	log: [String],
	winCtx: mongoose.Schema.Types.Mixed,
});

export interface GameModel {
	id: string;
	game: string;
	room: string;
	players: Map<string, Player>;
	created: Date;
	started: Date | null;
	ended: Date;
	log: string[];
	winCtx?: unknown;
}
const model = mongoose.model('game', schema, 'games');

export async function uploadGame(game: GameModel): Promise<GameModel | null> {
	if (!IS_ENABLED.DB) return null;
	return model.create(game);
}

export async function getGameById(gameType: string, gameId: string): Promise<HydratedDocument<GameModel> | null> {
	if (!IS_ENABLED.DB) return null;
	const id = gameId.toUpperCase().replace(/^#?/, '#');
	const game = await model.findOne({ game: gameType, id });
	if (!game) throw new Error(`Unable to find a game of ${gameType} with ID ${id}.`);
	return game;
}
