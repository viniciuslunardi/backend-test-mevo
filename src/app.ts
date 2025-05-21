import express from 'express';
import router from './routes/transactions.routes';
import logger from './shared/logger';
import { connectDb } from './infra/db/mongo/mongo.connection';

const app = express();

app.use(express.json());
// @todo melhorar a parte de segurança com middlewares para verificar os tipos de arquivos
app.use('/transactions', router);

// @todo placeholder para agora
const configDb = {
    user: 'admin',
    password: 'admin',
    uri: 'localhost',
    port: '27017',
    db: 'mevo_db',
    auth: 'admin',
};

// @todo use config file
// @todo melhorar esse app.ts

connectDb(configDb).then(() => {
    app.listen(3000, () => {
        logger.info('Server running on port 3000');
    });
});
