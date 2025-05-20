import mongoose, { type Mongoose } from 'mongoose';

import { IS_ENABLED } from '@/enabled';
import { log } from '@/utils/logger';

const connection: Promise<Mongoose> | null = IS_ENABLED.DB ? mongoose.connect(process.env.MONGO_URL!) : null;
if (connection) connection.then(() => log('Connected to database!'));
else log('Skipping database...');

export default connection;
