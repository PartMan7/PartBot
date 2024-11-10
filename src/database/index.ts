import mongoose from 'mongoose';

import '@/env';

const connection = mongoose.connect(process.env.MONGO_URL!);
connection.then(() => log('Connected to database!'));

export default connection;
