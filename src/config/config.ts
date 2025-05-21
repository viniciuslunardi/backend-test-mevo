import { Config } from '../types/config.types';

const config: Config = {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    application: {
        transactionTreshold: process.env.SUSPICIOUS_TRESHOLD
            ? parseInt(process.env.SUSPICIOUS_TRESHOLD)
            : 5000000,
    },
    db: {
        mongo: {
            host: process.env.MONGO_HOST,
            port: process.env.MONGO_PORT,
            password: process.env.MONGO_PASSWORD,
            db: process.env.MONGO_DB,
            user: process.env.MONGO_USER,
            auth: process.env.MONGO_AUTH,
        },
    },
    log: {
        level: process.env.LOG_LEVEL || 'debug',
        label: process.env.LOG_LABEL || 'MEVO-PROCESSOR',
    },
};

export default config;
