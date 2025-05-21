import mongoose from 'mongoose';
import { MongoConfig } from '../../../types/config.types';
import logger from '../../../shared/logger';

export async function connectDb(config: MongoConfig) {
    const uri = `mongodb://${config.user}:${config.password}@${config.host}:${config.port}/${config.db}?authSource=${config.auth}`;
    try {
        await mongoose.connect(uri);
        logger.info(`Connected to db sucessfully`);
    } catch (err) {
        logger.error(`Error connection db:`, err);
        logger.debug(`URI: ${uri}`);
        process.exit(1);
    }
}
