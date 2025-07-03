import mongoose, { type Mongoose } from 'mongoose';

import { IS_ENABLED } from '@/enabled';
import { Logger } from '@/utils/logger';

const connection: Promise<Mongoose> | null = IS_ENABLED.DB ? mongoose.connect(process.env.DB_MONGO_URL!) : null;
if (connection) connection.then(() => Logger.log('Connected to database!'));

export default connection;
