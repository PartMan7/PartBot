import mongoose from 'mongoose';

import '@/env';

export function connect(): Promise<typeof mongoose> {
	return mongoose.connect(process.env.MONGO_URL);
}

export function disconnect(): Promise<void> {
	return mongoose.disconnect();
}
