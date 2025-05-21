import mongoose from "mongoose";
import { MongoConfig } from "../../../types/config.types";
import logger from "../../../shared/logger";

export async function connectDb(config: MongoConfig) {
    const uri = `mongodb://${config.user}:${config.password}@${config.uri}:${config.port}/${config.db}?authSource=${config.auth}`
    try {
        await mongoose.connect(uri);
        logger.info(`Connected to db sucessfully`, { label: 'db'})
    } catch (err) {
        logger.error(`Error connection db:`, err)
        logger.info(`URI: ${uri}`)
        process.exit(1);
    }
}