import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import TransactionService from '../../services/transactions/transactions.service';
import logger from '../../shared/logger';
import { TransactionData } from '../../types/transaction.types';
import config from '../../config/config';

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

            const mimeTypesAllowed = config.application.mimeTypesAllowed; // @todo deixar isso como config

            if (!mimeTypesAllowed.includes(req.file.mimetype)) {
                return res.status(StatusCodes.UNSUPPORTED_MEDIA_TYPE).send({
                    message:
                        'Unsupported file type. Only CSV files are allowed.',
                });
            }

            logger.info(`Processing file...`);
            logger.debug(
                JSON.stringify({
                    originalname: req.file.originalname,
                    mimetype: req.file.mimetype,
                }),
            ); // @todo logar isso de uma forma mais interessante (melhorar os logs num geral)
            const processedData =
                await this.transactionService.processTransaction(
                    req.file.buffer,
                    req.file.originalname,
                );

            logger.info(`File processed sucessfully!`);
            return res.status(StatusCodes.OK).send({
                validTransactionsProcessed: processedData.valid.length,
                invalidTransactionsProcessed: processedData.invalid.length,
                invalidTransactionsData: processedData.invalid,
                fileName: req.file.originalname,
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
