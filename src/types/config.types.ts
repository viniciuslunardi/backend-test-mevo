export interface MongoConfig {
    host?: string;
    port?: string;
    password?: string;
    db?: string;
    user?: string;
    auth?: string;
}

export interface Config {
    db: { mongo: MongoConfig };
    port: number;
    application: {
        transactionTreshold: number;
        mimeTypesAllowed: Array<string>;
    };
    log: { level: string; label: string };
}
