import csv from 'csv-parser';
import { Readable } from 'stream';
import logger from '../shared/logger';

import {
    FileData,
    ProcessedData,
    TransactionData,
    InvalidTransactionReasons,
} from '../types/transaction.types';
import { TransactionRepository } from '../repositories/transaction.repository';
import { InvalidSummaryRepository } from '../repositories/invalidSummary.repository';

const SUSPICIOUS_TRESHOLD = 5000000; // @todo -- config file

export default class TransactionService {
    private transactionRepository: TransactionRepository;
    private invalidSummaryRepository: InvalidSummaryRepository;

    constructor() {
        this.transactionRepository = new TransactionRepository();
        this.invalidSummaryRepository = new InvalidSummaryRepository();
    }

    async processTransaction(bufferFile: Buffer): Promise<ProcessedData> {
        const processedData: ProcessedData = { valid: [], invalid: [] };
        const transactionValues = new Set<string>();

        const stream = Readable.from(bufferFile);

        // @todo - ver se tem alguma forma melhor de fazer isso
        return new Promise((resolve, reject) => {
            stream
                .pipe(csv({ separator: ';' }))
                .on('data', (data: FileData) => {
                    try {
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

                        const duplicated = transactionValues.has(
                            `from:${transactionData.from}-amount:${transactionData.amount}-to:${transactionData.to}`,
                        );

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
                        transactionValues.add(
                            `from:${transactionData.from}-amount:${transactionData.amount}-to:${transactionData.to}`,
                        );
                    } catch (err) {
                        // @todo - melhorar tratamentos de erro
                        logger.error('@error processing transaction:', err);
                    }
                })
                .on('error', (err) => {
                    logger.error('@error streaming file: ', err);
                    reject(err);
                })
                .on('end', async () => {
                    // @todo - salvar num banco de dados
                    const { valid, invalid } = processedData;

                    //@todo ver uma forma de fazer em bulk, vou deixar assim por agora, sei que ta meio feio
                    const promises = [];

                    for (const validTransactions of valid) {
                        const data = {
                            from: validTransactions.transactionData.from,
                            to: validTransactions.transactionData.to,
                            amount: validTransactions.transactionData.amount,
                            suspicious: validTransactions.suspicious,
                        };
                        promises.push(this.transactionRepository.create(data));
                    }

                    for (const invalidTransactions of invalid) {
                        const data = {
                            //@todo adicionar o filename
                            summary: `FROM:${invalidTransactions.transactionData.from}-TO${invalidTransactions.transactionData.to}-AMOUNT${invalidTransactions.transactionData.amount}`,
                            reason: invalidTransactions.reason,
                        };

                        promises.push(
                            this.invalidSummaryRepository.create(data),
                        );
                    }

                    await Promise.all(promises);
                    resolve(processedData);
                });
        });
    }
}
