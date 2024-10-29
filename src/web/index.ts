import express from 'express';
import { port } from '@/config/web';

import loadAPI from '@/web/loaders/api';

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

loadAPI(app);

app.listen(port, () => log(`Web API is running!`));

export default app;
