import mongoose from 'mongoose';

import '@/env';

mongoose.connect(process.env.MONGO_URL).then(() => log('Connected to the database!'));

export default mongoose;
