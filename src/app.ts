import express from 'express';

import config from './config/config';
import router from './routes/transactions.routes';
import logger from './shared/logger';
import { connectDb } from './infra/db/mongo/mongo.connection';

const app = express();

app.use(express.json());
// @todo melhorar a parte de segurança com middlewares para verificar os tipos de arquivos
app.use('/transactions', router);

// @todo melhorar esse app.ts

connectDb(config.db.mongo).then(() => {
    app.listen(config.port, () => {
        logger.info(`Server running on ${config.port}`);
    });
});
