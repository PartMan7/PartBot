import mongoose from 'mongoose';

import type { BasePlayer } from '@/ps/games/common';

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
});

schema.index({ id: 1 });

export interface GameModel {
	id: string;
	game: string;
	room: string;
	players: Map<string, BasePlayer>;
	created: Date;
	started: Date | null;
	ended: Date;
	log: string[];
}
const model = mongoose.model('game', schema, 'games');

export function uploadGame(game: GameModel): Promise<GameModel> {
	return model.create(game);
}
