import express from 'express';

import config from './config/config';
import router from './routes/transactions/transactions.routes';
import logger from './shared/logger';
import { connectDb } from './repositories/mongo/mongo.connection';

const app = express();

app.use(express.json());
app.use('/transactions', router);

// @todo eu deixaria melhor esse app.ts, como uma classe que instancia os controllers, db e routes e sobe o server
connectDb(config.db.mongo).then(() => {
    app.listen(config.port, () => {
        logger.info(`Server running on ${config.port}`);
    });
});
