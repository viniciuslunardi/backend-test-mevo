import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import TransactionService from '../../services/transactions/transactions.service';
import logger from '../../shared/logger';
import { TransactionData } from '../../types/transaction.types';

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
            if (!req.file)
                return res
                    .status(StatusCodes.BAD_REQUEST)
                    .send({ message: `File was not sent.` }); // @todo aqui eu trataria melhor essa mensagem de erro, deixando isso mais dinamico e usando uma forma de suporte a i18n

            const mimeTypesAllowed = 'text/csv'; // @todo deixar isso como config

            if (mimeTypesAllowed !== req.file.mimetype) {
                return res.status(StatusCodes.UNSUPPORTED_MEDIA_TYPE).send({
                    message:
                        'Unsupported file type. Only CSV files are allowed.',
                });
            }

            logger.info(`Processing file...`);
            const processedData =
                await this.transactionService.processTransaction(
                    req.file.buffer,
                    req.file.originalname,
                );

            return res.status(StatusCodes.OK).send({
                validTransactionsProcessed: processedData.valid.length,
                invalidTransactionsProcessed: processedData.invalid.length,
                invalidTransactionsData: processedData.invalid,
            });
        } catch (err) {
            logger.error(
                `@CRITICAL:::: Servidor encontrou erro ao processar a request!`,
            );
            logger.error(err);
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .send({ message: 'Server unable to process request' });
        }
    }
}
