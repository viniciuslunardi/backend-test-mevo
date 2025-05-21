export interface MongoConfig {
    uri: string;
    port: string;
    password: string;
    db: string;
    user: string;
    auth: string;
}

export interface config {
    db: { mongo: MongoConfig };
    port: number;
    application: { transactionTreshold: number };
}
