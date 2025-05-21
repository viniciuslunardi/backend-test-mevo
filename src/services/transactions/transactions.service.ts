import csv from 'csv-parser';
import { Readable } from 'stream';
import logger from '../../shared/logger';

import {
    FileData,
    ProcessedData,
    TransactionData,
    InvalidTransactionReasons,
} from '../../types/transaction.types';
import { TransactionRepository } from '../../repositories/transactions/transaction.repository';
import { InvalidSummaryRepository } from '../../repositories/invalidSummary/invalidSummary.repository';

const SUSPICIOUS_TRESHOLD = 5000000; // @todo -- config file

export default class TransactionService {
    private transactionRepository: TransactionRepository;
    private invalidSummaryRepository: InvalidSummaryRepository;

    constructor() {
        this.transactionRepository = new TransactionRepository();
        this.invalidSummaryRepository = new InvalidSummaryRepository();
    }

    async processTransaction(
        bufferFile: Buffer,
        fileName: string,
    ): Promise<ProcessedData> {
        const processedData: ProcessedData = { valid: [], invalid: [] };
        const transactionSet: Set<string> = new Set();
        const stream = Readable.from(bufferFile);

        // @todo - ver se tem alguma forma melhor de fazer isso
        try {
            return new Promise((resolve, reject) => {
                stream
                    .pipe(csv({ separator: ';' }))
                    .on('data', (data: FileData) => {
                        try {
                            this.validateTransaction(
                                data,
                                transactionSet,
                                processedData,
                            );
                        } catch (err) {
                            // @todo - melhorar tratamentos de erro
                            logger.error(
                                '@Error processing single transaction',
                                err,
                            );
                            logger.info('@Error: transaction data:', data);
                        }
                    })
                    .on('error', (err) => {
                        logger.error(
                            '@CRITICAL:::: Error streaming file! ',
                            err,
                        );
                        reject(err);
                    })
                    .on('end', async () => {
                        try {
                            await this.persistData(processedData, fileName);

                            resolve(processedData);
                        } catch (err) {
                            reject(err);
                        }
                    });
            });
        } catch (err) {
            logger.error(`@CRITICAL:::: Error streaming file!`, err);
            throw err;
        }
    }

    private validateTransaction(
        data: FileData,
        transactionSet: Set<string>,
        processedData: ProcessedData,
    ): void {
        const from = parseInt(data.from);
        const to = parseInt(data.to);
        const amount = parseInt(data.amount);

        const transactionData: TransactionData = {
            from,
            to,
            amount,
        };

        if (isNaN(to) || isNaN(from) || isNaN(amount)) {
            processedData.invalid.push({
                transactionData,
                reason: InvalidTransactionReasons.INVALID_TYPE,
            });
            return;
        }

        if (amount < 0) {
            processedData.invalid.push({
                transactionData,
                reason: InvalidTransactionReasons.NEGATIVE_AMOUT,
            });
            return;
        }

        const key = this.createTransactionKey(from, to, amount);

        const duplicated = transactionSet.has(key);

        if (duplicated) {
            processedData.invalid.push({
                transactionData,
                reason: InvalidTransactionReasons.DUPLICATED,
            });
            return;
        }

        const suspicious = amount >= SUSPICIOUS_TRESHOLD;

        processedData.valid.push({
            transactionData,
            suspicious,
        });

        transactionSet.add(key);
    }

    private createTransactionKey(
        from: number,
        to: number,
        amount: number,
    ): string {
        return `FROM=${from}-TO=${to}-AMOUNT=${amount}`;
    }

    private async persistData(processedData: ProcessedData, fileName: string) {
        const { valid, invalid } = processedData;

        const createValidTransactions = valid.map((entry) =>
            this.transactionRepository.create({
                from: entry.transactionData.from,
                to: entry.transactionData.to,
                amount: entry.transactionData.amount,
                suspicious: entry.suspicious,
            }),
        );

        const createInvalidSummaries = invalid.map((entry) =>
            this.invalidSummaryRepository.create({
                summary: this.createTransactionKey(
                    entry.transactionData.from,
                    entry.transactionData.to,
                    entry.transactionData.amount,
                ),
                reason: entry.reason,
                fileName,
            }),
        );

        await Promise.all([
            ...createValidTransactions,
            ...createInvalidSummaries,
        ]);
    }
}
