import mongoose from 'mongoose';

export function connect(): Promise<typeof mongoose> {
	return mongoose.connect(process.env.MONGO_URL);
}

export function disconnect(): Promise<void> {
	return mongoose.disconnect();
}
