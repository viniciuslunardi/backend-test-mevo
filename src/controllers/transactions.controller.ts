import { Request, Response } from 'express';
import TransactionService from '../services/transactions.service';
import logger from '../shared/logger';
import { TransactionData } from '../types/transaction.types';

export default class TransactionController {
    private transactionService: TransactionService;

    constructor() {
        this.transactionService = new TransactionService();
    }

    public async processTransactions(
        req: Request,
        res: Response,
    ): Promise<
        Response<
            | {
                  validTransactionsProcessed: number;
                  invalidTransactionsProcessed: number;
                  invalidTransactionsData: TransactionData[];
              }
            | Response
        >
    > {
        try {
            //@todo valir o tipo de arquivo que vamos processar e receber -- deve ser só csv
            if (!req.file) return res.status(422).send('file not sent'); // @todo tratamento de erros

            logger.info(`Processing file...`); // @todo melhorar os loggers
            const processedData =
                await this.transactionService.processTransaction(
                    req.file.buffer,
                );

            // @todo - http status codes
            return res.status(200).send({
                validTransactionsProcessed: processedData.valid.length,
                invalidTransactionsProcessed: processedData.invalid.length,
                invalidTransactionsData: processedData.invalid,
            });
        } catch (err) {
            logger.error(err);
            //@todo use https-status-codes
            return res.status(500).send('Server error');
        }
    }
}
