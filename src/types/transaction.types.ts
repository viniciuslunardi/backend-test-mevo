export interface FileData {
    from: string;
    to: string;
    amount: string;
}

export interface TransactionData {
    from: number;
    to: number;
    amount: number;
}

export interface ProcessedData {
    valid: Array<{ transactionData: TransactionData; suspicious?: boolean }>;
    invalid: Array<{ reason: string; transactionData: TransactionData }>;
}

export enum InvalidTransactionReasons {
    NEGATIVE_AMOUT = 'Transação com valor negativo',
    DUPLICATED = 'Transação duplicada',
    INVALID_TYPE = 'Transação com valores inválidos, devem ser apenas valores numéricos',
}
